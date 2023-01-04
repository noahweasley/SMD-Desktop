"use-strict";
const mockData = require("./mock-data");

module.exports.getRandomClipboardText = function () {
  let random = Math.random();
  let albumUrl = "https://open.spotify.com/album/21jF5jlMtzo94wbxmJ18aa?si=ed91578d41954092";
  let playlistUrl = "https://open.spotify.com/playlist/1SDUSy4TAtzB9HnFmvD6yJ?si=2907d6141b2b43d8";

  return random > 0.5 ? albumUrl : playlistUrl;
};

module.exports.getDummyPlayList = function () {
  let trackCollection = [
    { songTitle: "Pretty Girl", artistNames: ["Thomas Rivera"] },
    { songTitle: "In Your Eyes", artistNames: ["Ray-X"] },
    {
      songTitle: "Wellerman (Female Trap Remix)",
      artistNames: ["Remix Kingz"]
    },
    { songTitle: "Mad at Disney", artistNames: ["Natalie Summer"] },
    {
      songTitle: "Toosie Slide (TikTok Remix)",
      artistNames: ["Dance Time Trio"]
    },
    {
      songTitle: "The Chicken Wing Beat",
      artistNames: ["DJ Quarantine"]
    },
    { songTitle: "Kings & Queens", artistNames: ["Don Blaine"] },
    { songTitle: "Dancing Is What to Do", artistNames: ["Ray-X"] },
    {
      songTitle: "Someone You Loved (Remix)",
      artistNames: ["Remix Kingz"]
    },
    { songTitle: "Some Say", artistNames: ["Natalie Summer"] },
    { songTitle: "Anyone", artistNames: ["Thomas Vee"] },
    {
      songTitle: "Heather (Female Dance Remix)",
      artistNames: ["DJ Quarantine"]
    },
    { songTitle: "Do It Solo", artistNames: ["Thomas Rivera"] },
    { songTitle: "Don't Leave Me Alone", artistNames: ["Ray-X"] },
    { songTitle: "Tik Tok", artistNames: ["Ashley Price"] },
    { songTitle: "Just Wait Till I Glow Up", artistNames: ["Dubskie"] },
    {
      songTitle: "Kiss You Each Morning (With Strawberry Skies)",
      artistNames: ["Thomas Vee"]
    },
    {
      songTitle: "Okay Okay Hit It (TikTok Dance)",
      artistNames: ["DJ Quarantine"]
    },
    { songTitle: "This City", artistNames: ["Don Blaine"] },
    { songTitle: "Breaking Me", artistNames: ["Ray-X"] },
    {
      songTitle: "Bored in the House, in the House Bored",
      artistNames: ["Ajay Stephens"]
    },
    {
      songTitle: "Coffin Dance RIP (I'm Finna Die)",
      artistNames: ["Dubskie", "Awkward African"]
    },
    {
      songTitle: "When I Lose Control (TikTok Dance Challenge)",
      artistNames: ["Remix Kingz"]
    },
    { songTitle: "Levitating", artistNames: ["Natalie Summer"] },
    { songTitle: "Savage Love", artistNames: ["Don Blaine"] },
    { songTitle: "The Spectre", artistNames: ["Ray-X"] },
    {
      songTitle: "Memories (Drinks Bring Back)",
      artistNames: ["Ajay Stephens"]
    },
    {
      songTitle: "Close Your Eyes Shut Your Mouth (Dream)",
      artistNames: ["Dubskie"]
    },
    {
      songTitle: "Before You Go (Female Dance Remix)",
      artistNames: ["Remix Kingz"]
    },
    { songTitle: "Positions", artistNames: ["Ashley Price"] },
    { songTitle: "Play Date", artistNames: ["Don Blaine"] },
    { songTitle: "Takeaway", artistNames: ["Ray-X"] },
    {
      songTitle: "Friends Forever (Graduation)",
      artistNames: ["Ajay Stephens"]
    },
    { songTitle: "Diamonds", artistNames: ["Thomas Vee"] },
    {
      songTitle: "Stupid Love (EDM Remix) [TikTok Challenge]",
      artistNames: ["Remix Kingz"]
    },
    {
      songTitle: "Dancing With Your Ghost",
      artistNames: ["Ashley Price"]
    },
    { songTitle: "Alone Pt 2", artistNames: ["Don Blaine"] },
    {
      songTitle: "Jenny (I Wanna Ruin Our Friendship)",
      artistNames: ["Ray-X"]
    },
    {
      songTitle: "Picture Perfect (No Filter)",
      artistNames: ["Ajay Stephens"]
    },
    {
      songTitle: "Haha Look at Me I Put a Face on Wow",
      artistNames: ["DJ Quarantine"]
    },
    {
      songTitle: "Yummy (Dance Remix) [TikTok Challenge]",
      artistNames: ["Remix Kingz"]
    },
    {
      songTitle: "It Took Too Long For You To Call Back",
      artistNames: ["Ashley Price"]
    },
    {
      songTitle: "Better When I'm Dancin'",
      artistNames: ["Don Blaine"]
    },
    {
      songTitle: "Fuck Me Till the Daylight",
      artistNames: ["Natalie Summer"]
    },
    {
      songTitle: "Bored in the House, Pt. 2",
      artistNames: ["Ajay Stephens"]
    },
    {
      songTitle: "You Would Not Believe Your Eyes",
      artistNames: ["DJ Quarantine"]
    },
    {
      songTitle: "Drivers License (Dance Remix)",
      artistNames: ["Remix Kingz"]
    },
    { songTitle: "Shower", artistNames: ["Ashley Price"] },
    { songTitle: "Magic In The Hamptons", artistNames: ["Don Blaine"] },
    {
      songTitle: "Now That Was A Lot Of Damage",
      artistNames: ["Dubskie"]
    },
    {
      songTitle: "Don't Let This Flop",
      artistNames: ["Ajay Stephens"]
    }
  ];

  return {
    type: "playlist",
    description: {
      thumbnails: [
        "https://mosaic.scdn.co/640/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be",
        "https://mosaic.scdn.co/300/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be",
        "https://mosaic.scdn.co/60/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be"
      ],
      name: "I Can Swear I Can Joke",
      trackCollection
    }
  };
};

module.exports.getDummyAlbum = function () {
  let trackCollection = [
    {
      thumbnails: undefined,
      songTitle: "Strangers By Nature",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Easy On Me",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "My Little Love",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Cry Your Heart Out",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Oh My God",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Can I Get It",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "I Drink Wine",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "All Night Parking (with Erroll Garner) Interlude",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Woman Like Me",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Hold On",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "To Be Loved",
      artistNames: ["Adele"]
    },
    {
      thumbnails: undefined,
      songTitle: "Love Is A Game",
      artistNames: ["Adele"]
    }
  ];

  return {
    type: "playlist",
    description: {
      thumbnails: [
        "https://mosaic.scdn.co/640/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be",
        "https://mosaic.scdn.co/300/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be",
        "https://mosaic.scdn.co/60/ab67616d0000b27306f50380b35deaa089d49e02ab67616d0000b27371a0de1510f1f7718bbd66e3ab67616d0000b273953cffbfb8cf1c476103c2a1ab67616d0000b273e50e149e91b80da50586a8be"
      ],
      name: "I Can Swear I Can Joke",
      trackCollection
    }
  };
};

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
    dummy.push({ song: songs[i], artist: artists[i] });
  }

  return dummy;
};

module.exports.getMockDownloadList = () => mockData;
