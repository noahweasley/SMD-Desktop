require("dotenv").config();
const { app } = require("electron");
const { mkdir, open, watch } = require("fs");
const { readdir, stat, unlink, open: _open, mkdir: _mkdir } = require("fs/promises");
const { join, extname, basename } = require("path");
const { getReadableSize } = require("./math");
const FILE_EXTENSIONS = require("./file-extensions");

function __exports() {
  const binaryFilename = "yt-dlp";
  const downloadFlagFilename = `flag${FILE_EXTENSIONS.TMP}`;

  /**
   * create the download directory
   */
  function createAppFilesDir() {
    const downloadDirectory = getDownloadsDir();
    const thumbnailDirectory = getThumbnailDir(downloadDirectory);
    const tempThumbDirectory = getTempThumbDir(downloadDirectory);

    open(downloadDirectory, "r+", (err) => {
      if (err) {
        if (err.code === "EEXIST") return;
        else if (err.code === "ENOENT") {
          mkdir(thumbnailDirectory, { recursive: true }, () => {});
          mkdir(tempThumbDirectory, { recursive: true }, () => {});
        } else console.log(err.code);
      }
    });
  }

  /**
   * @returns the music files download directory for the application
   */
  function getDownloadsDir() {
    return join(app.getPath("music"), app.getName(), "Download");
  }

  /**
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the thumbnail directory
   */
  function getThumbnailDir(parentDirectory) {
    return join(parentDirectory || getDownloadsDir(), ".thumb");
  }

  /**
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the temporary thumbnail directory
   */
  function getTempThumbDir(parentDirectory) {
    return join(parentDirectory || getDownloadsDir(), ".temp", ".thumb");
  }

  function _getBinaryFilepath(parentDirectory) {
    const filePath = join(parentDirectory, binaryFilename);
    return process.platform == "win32" ? filePath.concat(FILE_EXTENSIONS.EXE) : filePath;
  }

  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  function getBinaryFileDirectory() {
    return process.env.BINARY_LOCATION || join(app.getPath("appData"), binaryFilename);
  }

  /**
   * Retrieves the binary file path, if `parentDirectory` is undefined,  it finds the binary file directory
   *
   * @param {string} parentDirectory the directory in which to append to the binary file path
   * @returns the full file path to the ytdlp binary file
   */
  function getBinaryFilepath(parentDirectory) {
    const binaryFileDirectory = parentDirectory || getBinaryFileDirectory();
    return _getBinaryFilepath(binaryFileDirectory);
  }

  /**
   *
   * @returns
   */
  function getBinaryDownloadFlag() {
    return join(getBinaryFileDirectory(), downloadFlagFilename);
  }

  /**
   * Watch a file and detect file changes
   *
   * @param {string} filePath
   * @returns {Promise<string>} a Promise that resolves when there is a detected file change
   */
  function watchFileForChanges(filePath) {
    return new Promise((resolve) => {
      const watcher = watch(filePath, (eventType, filename) => {
        if (filename && eventType === "change") {
          watcher.close();
          resolve(filename);
        }
      });
    });
  }

  /**
   * Deletes all the files in a directory
   *
   * @param {string} dirPath the directory in which all files within it would be deleted
   * @returns true if all files were deleted
   */
  async function deleteFilesInDirectory(dirPath) {
    let files;
    try {
      files = await readdir(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const isFile = (await stat(filePath)).isFile();
        if (isFile) await unlink(filePath);
      }
    } catch (error) {
      return false;
    }

    return true;
  }

  /**
   * @param {string} filepath the path to the file
   * @returns a human readable representation of file size
   */
  async function getReadableFileSize(filepath) {
    const sizeInBytes = (await stat(filepath)).size;
    return getReadableSize(sizeInBytes);
  }

  /**
   * @returns {Promise<boolean>} a flag indicating if a file exists or not
   */
  async function checkIfFileExists(filePath) {
    let fileHandle;

    try {
      fileHandle = await _open(filePath, "r+");
    } catch (error) {
      return false;
    } finally {
      fileHandle?.close();
    }

    return true;
  }

  /**
   * Checks if the binary file directory has been created, if not, it creates it and returns the directory path
   *
   * @returns a Promise that resolves to the directory where the the ytdlp binary file was downloaded
   */
  async function getOrCreateBinaryFileDirectory() {
    const directoryPath = getBinaryFileDirectory();

    try {
      await _open(directoryPath, "r");
    } catch (err) {
      if (err.code === "ENOENT") {
        await _mkdir(directoryPath, { recursive: true });
      } else {
        throw err;
      }
    }

    return directoryPath;
  }

  /**
   * Checks if the binary file has been downloaded and/or exists then return the file path, if not, it throws an error
   *
   * @returns the full file path to the ytdlp binary file
   */
  async function getBinaryFilepathOrThrowError() {
    const binaryFileDirectory = await getOrCreateBinaryFileDirectory();
    const files = await readdir(binaryFileDirectory);
    const filePath = files.find((file) => basename(file, extname(file)).toLowerCase() === binaryFilename.toLowerCase());

    if (filePath) {
      const fullBinaryFilepath = join(binaryFileDirectory, filePath);
      return fullBinaryFilepath;
    } else {
      throw new Error(`File '${binaryFilename}' not found in directory '${binaryFileDirectory}'`);
    }
  }

  return {
    checkIfFileExists,
    createAppFilesDir,
    getDownloadsDir,
    getTempThumbDir,
    getThumbnailDir,
    getBinaryDownloadFlag,
    getBinaryFileDirectory,
    getBinaryFilepath,
    watchFileForChanges,
    deleteFilesInDirectory,
    getReadableFileSize,
    getOrCreateBinaryFileDirectory,
    getBinaryFilepathOrThrowError
  };
}

module.exports = __exports();
