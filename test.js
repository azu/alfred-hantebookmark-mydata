import test from "ava";
import alfyTest from "alfy-test";
test("return", async t => {
    // http://b.hatena.ne.jp/sample/search.data
    process.env.HATENA_ACCOUNT_NAME = "sample";

    const alfy = alfyTest();
    const result = await alfy("hatebu");

    console.log(JSON.stringify(result));
});
