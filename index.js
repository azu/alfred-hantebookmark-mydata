"use strict";
const alfy = require("alfy");
const CACHE_KEY = "alfred-hantebookmark-mydata";
const getUserName = () => {
    if (!process.env.HATENA_ACCOUNT_NAME) {
        throw new Error(
            "Please set your hatena account to 'HATENA_ACCOUNT_NAME' variable. https://www.alfredapp.com/help/workflows/advanced/variables/"
        );
    }
    return process.env.HATENA_ACCOUNT_NAME;
};
const outputSearchData = items => {
    const philtre = require("philtre").philtre;
    const outputItems = philtre(alfy.input, items).map(item => {
        return {
            match: `${item.url} ${item.title} ${item.comment}`,
            uid: item.url,
            title: item.title,
            subtitle: `${item.comment} | ${item.date.toISOString()}`,
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
            const parse = require("hatebu-mydata-parser").parse;
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
            outputSearchData(items);
            alfy.cache.set(CACHE_KEY, JSON.stringify(sortedItems), { maxAge: 60 * 1000 });
        })
        .catch(error => {
            alfy.error(error);
        });
}
