const { app } = require("electron");
const { mkdir, open, watch } = require("fs");
const { readdir, stat, unlink, open: _open, mkdir: _mkdir } = require("fs/promises");
const { join, extname, basename } = require("path");
const { getReadableSize } = require("./math");
const FILE_EXTENSIONS = require("./file-extensions");

/**
 * A module with all file utilities
 *
 * @module files
 */
function __exports() {
  const binaryFilename = "yt-dlp";
  /**
   * The ytdlp binary file name
   */
  const getBinaryFilename = () => binaryFilename;

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
        }
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
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the
   * default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the thumbnail directory
   */
  function getThumbnailDir(parentDirectory) {
    return join(parentDirectory || getDownloadsDir(), ".thumb");
  }

  /**
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the
   * default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the temporary thumbnail directory
   */
  function getTempThumbDir(parentDirectory) {
    return join(parentDirectory || getDownloadsDir(), ".temp", ".thumb");
  }

  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  function getBinaryFileDirectory() {
    return process.env.BINARY_LOCATION || join(app.getPath("userData"), "bin", binaryFilename);
  }

  function _getBinaryFilepath(parentDirectory) {
    const filePath = join(parentDirectory, binaryFilename);
    return process.platform === "win32" ? filePath.concat(FILE_EXTENSIONS.EXE) : filePath;
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
   * Watch a file and detect file changes
   *
   * @param {string} filePath
   * @param (number) timeout
   * @returns {Promise<string>} a Promise that resolves when there is a detected file change
   */
  function watchFileForChangeEvent(filePath, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const watcher = watch(filePath, (eventType, filename) => {
        if (filename && eventType === "change") {
          watcher.close();
          resolve(filename);
        }
      });

      const timeoutId = setTimeout(() => {
        watcher.close();
        resolve();
      }, timeout);

      watcher.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(error);
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
    getBinaryFileDirectory,
    getBinaryFilepath,
    watchFileForChangeEvent,
    deleteFilesInDirectory,
    getReadableFileSize,
    getOrCreateBinaryFileDirectory,
    getBinaryFilepathOrThrowError,
    getBinaryFilename
  };
}

module.exports = __exports();
