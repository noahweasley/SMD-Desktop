const { describe, expect, test } = require("@jest/globals");
const { getReadableSize } = require("../app/src/main/util/math");

describe("Miscellaneous tests", () => {
  test("Converts bytes into human readable format", () => {
    const readableSizeInBytes = getReadableSize(200);
    const readableSizeInKilobytes = getReadableSize(2000);
    const readableSizeInMegabytes = getReadableSize(2000000);
    const readableSizeInGigabytes = getReadableSize(2000000000);
    const readableSizeInTerabytes = getReadableSize(2000000000000);

    expect(readableSizeInBytes).toEqual("200 BYTE");
    expect(readableSizeInKilobytes).toEqual("2 KB");
    expect(readableSizeInMegabytes).toEqual("2 MB");
    expect(readableSizeInGigabytes).toEqual("2 GB");
    expect(readableSizeInTerabytes).toEqual("2 TB");
  });
});
