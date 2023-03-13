const { describe, expect, test } = require("@jest/globals");
const { getReadableSize } = require("../app/src/main/util/math");
const { getReadableFileSize } = require("../app/src/main/util/files");
const { join } = require("path");

describe("Miscellaneous tests", () => {
  test("Converts bytes into human readable format", () => {
    const readableSizeInBytes = getReadableSize(200);
    const readableSizeInKilobytes = getReadableSize(2000);
    const readableSizeInMegabytes = getReadableSize(2000000);
    const readableSizeInGigabytes = getReadableSize(2000000000);
    const readableSizeInTerabytes = getReadableSize(2000000000000);

    expect(readableSizeInBytes).toEqual("200 B");
    expect(readableSizeInKilobytes).toEqual("1.95 KB");
    expect(readableSizeInMegabytes).toEqual("1.91 MB");
    expect(readableSizeInGigabytes).toEqual("1.86 GB");
    expect(readableSizeInTerabytes).toEqual("1.82 TB");
  });

  test("Displays file size into human readable format", async () => {
    const dummyFile = join(__dirname, "./mock/dummy.txt");
    const readableSizeInBytes = await getReadableFileSize(dummyFile);
    expect(readableSizeInBytes).toEqual("1.05 KB");
  });
});
