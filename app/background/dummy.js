"use-strict";

/**
 * For Development purpose only!
 *
 * @param {*} size the size of dummy artists to be used
 * @returns the required size of dummy artists
 */
module.exports.getDummyArtists = function (size) {
  const artists = [
    "Marshmello",
    "Alan walker",
    "Carley Jaspen",
    "Kygo",
    "Neffex",
    "Lan Del Rey",
    "Billy Ellish",
    "Vicetone",
  ];

  if (size > artists.length) {
    let index = 0;
    for (let x = 0; x < size; x++) {
      artists.push(artists[(index = index++ == artists.length ? (index = 0) : index)]);
    }

    return artists;
  }

  return artists.slice(0, size);
};

/**
 * For Development purpose only!
 *
 * @param {*} size the size of dummy song titles to be used
 * @returns the required size of dummy song titles
 */
module.exports.getDummySongTitles = function (size) {
  const artists = [];

  if (size > artists.length) {
    let index = 0;
    for (let x = 0; x < size; x++) {
      artists.push(artists[(index = index++ == artists.length ? (index = 0) : index)]);
    }

    return artists;
  }

  return artists.slice(0, size);
};

/**
 * For Development purpose only!
 *
 * @param {*} size the size of dummy song titles to be used
 * @returns the required size of dummy song titles
 */
module.exports.getDummyTrack = function (size) {
  const songs = this.getDummySongTitles(size);
  const artists = this.getDummyArtists(size);

  return { songs, artists };
};
