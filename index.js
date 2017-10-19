"use strict";
const alfy = require("alfy");
const parse = require("hatebu-mydata-parser").parse;
const format = require("date-fns/format");
const CACHE_KEY = "alfred-hantebookmark-mydata";
const getUserName = () => {
    if (!process.env.HATENA_ACCOUNT_NAME) {
        throw new Error(
            "Please set your hatena account to 'HATENA_ACCOUNT_NAME' variable. https://www.alfredapp.com/help/workflows/advanced/variables/"
        );
    }
    return process.env.HATENA_ACCOUNT_NAME;
};
const match = (item, input) => {
    const lowerInput = input.toLowerCase();
    const patterns = lowerInput.split(" ");
    const title = item.title.toLowerCase();
    const comment = item.comment.toLowerCase();
    const url = item.url.toLowerCase();
    return patterns.some(pattern => {
        return url.includes(pattern) || title.includes(pattern) || comment.includes(pattern);
    });
};
const outputSearchData = items => {
    const outputItems = items.map(item => {
        return {
            match: `${item.url} ${item.title} ${item.comment}`,
            uid: item.url,
            title: item.title,
            subtitle: `${item.comment} | ${format(item.date, "YYYY-MM-DD")}`,
            arg: item.url,
            mods: {
                alt: {
                    arg: `http://b.hatena.ne.jp/entry/s/${item.url.replace(/^https?\/\/:/, "")}`,
                    subtitle: "Open HatenaBookmark page instead of the URL"
                }
            },
            quicklookurl: item.url
        };
    });
    alfy.output(outputItems);
};

// main
if (alfy.cache.has(CACHE_KEY)) {
    alfy.log(`cache: found`);
    try {
        const cacheResponse = alfy.cache.get(CACHE_KEY);
        const items = JSON.parse(cacheResponse);
        outputSearchData(items);
    } catch (error) {
        alfy.error(error);
    }
} else {
    alfy.log(`cache: not found`);
    const USER_NAME = getUserName();
    alfy
        .fetch(`http://b.hatena.ne.jp/${encodeURIComponent(USER_NAME)}/search.data`, {
            json: false
        })
        .then(response => {
            const items = parse(response);
            const sortedItems = items.sort((a, b) => {
                return b.date - a.date;
            });
            /*
            {
                title: "string",
                comment: "string",
                url: "string",
                date: new Date()
            };
            */
            alfy.cache.set(CACHE_KEY, JSON.stringify(sortedItems));
            outputSearchData(items);
        })
        .catch(error => {
            alfy.error(error);
        });
}
