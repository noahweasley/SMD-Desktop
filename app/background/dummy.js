"use-strict";

/**
 * For Development purpose only!
 *
 * @param {*} size the size of dummy artists to be used
 * @returns the required size of dummy artists
 */
module.exports.getDummyArtists = function (size) {
  const artists = ["Katy Perry", "Ashley Price", "Saphire", "Night-core High", "Alan Walker"];

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
  const songs = ["Daisies", "Overwhelmed", "Unity (Acoustic)", "Apollo", "Darkside"];

  if (size > songs.length) {
    let index = 0;
    for (let x = 0; x < size; x++) {
      songs.push(songs[(index = index++ == songs.length ? (index = 0) : index)]);
    }

    return songs;
  }

  return songs.slice(0, size);
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

  let dummy = [];
  
  for (let i = 0; i < size; i++) {
    dummy.push({song: songs[i], artist: artists[i]})
  }
  
  return dummy;
};
