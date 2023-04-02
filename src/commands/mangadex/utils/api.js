const axios = require("axios");
const { MANGADEX_ENDPOINT } = require("../../../utils/constants");

async function getMangaFromChapter(id) {
  try {
    const resp = await axios({
      method: "GET",
      url: `${MANGADEX_ENDPOINT}/chapter/${id}`,
    });

    const mangaID = resp.data.data.relationships.find(
      (rel) => rel.type === "manga"
    ).id;
    return { mangaID };
  } catch (error) {
    console.error(`Error in getMangaFromChapter: ${error}`);
    throw new Error(`Failed to get manga from chapter ID ${id}`);
  }
}

async function searchManga(title) {
  try {
    const order = {
      rating: "desc",
      followedCount: "desc",
    };

    const finalOrderQuery = {};

    for (const [key, value] of Object.entries(order)) {
      finalOrderQuery[`order[${key}]`] = value;
    }

    const resp = await axios({
      method: "GET",
      url: `${MANGADEX_ENDPOINT}/manga`,
      params: {
        title: title,
        ...finalOrderQuery,
      },
    });

    return resp;
  } catch (error) {
    console.error(`Error in searchManga: ${error}`);
    throw new Error(`Failed to search manga with title ${title}`);
  }
}

async function getLinkImage(chapterID) {
  try {
    const baseUrl = "https://api.mangadex.org";

    const resp = await axios({
      method: "GET",
      url: `${baseUrl}/at-home/server/${chapterID}`,
    });

    return resp;
  } catch (error) {
    console.error(`Error in getLinkImage: ${error}`);
    throw new Error(`Failed to get link image for chapter ID ${chapterID}`);
  }
}

async function searchChapter(title_id) {
  try {
    const languages = ["en"];

    const resp = await axios({
      method: "GET",
      url: `${MANGADEX_ENDPOINT}/manga/${title_id}/feed`,
      params: {
        translatedLanguage: languages,
        order: {
          chapter: "asc",
        },
      },
    });

    return resp;
  } catch (error) {
    console.error(`Error in searchChapter: ${error}`);
    throw new Error(`Failed to search chapter for manga with ID ${title_id}`);
  }
}

async function getMangaInfo(title_id) {
  try {
    const resp = await axios({
      method: "GET",
      url: `${MANGADEX_ENDPOINT}/manga/${title_id}`,
    });

    return resp;
  } catch (error) {
    console.error(`Error in getMangaInfo: ${error}`);
    throw error;
  }
}

async function getCover(title_id) {
  try {
    const resp = await axios({
      method: "GET",
      url: `${MANGADEX_ENDPOINT}/cover/${title_id}`,
    });

    return resp;
  } catch (error) {
    console.error(`Error in getCover: ${error}`);
    throw new Error(`Failed to get cover image for manga with ID ${title_id}`);
  }
}

async function getDataFromChapter(chapter_id) {
  const { mangaID } = await getMangaFromChapter(chapter_id);
  const dexTitle = await getMangaInfo(mangaID);
  const dexData = await searchChapter(mangaID);

  const manga_title = dexTitle.data.data.attributes.title.en;
  const chapters = dexData.data.data.map((manga) => ({
    id: manga.id,
    vol: manga.attributes.volume,
    chapter: manga.attributes.chapter,
    title: manga.attributes.title,
  }));

  const dexChapters = chapters.map(
    (chapter) =>
      `${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
        chapter.chapter ? `Ch. ${chapter.chapter}` : ``
      }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
        chapter.title ? `${chapter.title}` : ``
      }`
  );

  return {
    mangaID: mangaID,
    chapterID: chapter_id,
    mangaTitle: manga_title,
    chapters: chapters,
    dexChapters: dexChapters,
  };
}

async function getListChapters(id) {
  const pageSize = 10;

  const dexData = await searchChapter(id);

  let chapters,
    dexChapters,
    dexChaptersBold,
    dexChaptersJSON,
    paginatedDexChaptersJSON,
    paginatedDexChaptersBold;

  if (dexData.data.data.length != 0) {
    chapters = dexData.data.data.map((manga) => ({
      id: manga.id,
      vol: manga.attributes.volume,
      chapter: manga.attributes.chapter,
      title: manga.attributes.title,
    }));

    dexChaptersBold = chapters.map(
      (chapter, index) =>
        `**${index + 1}.** ${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
          chapter.chapter ? `Ch. ${chapter.chapter}` : ``
        }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
          chapter.title ? `${chapter.title}` : ``
        }`
    );

    dexChapters = chapters.map(
      (chapter) =>
        `${chapter.vol ? `Vol. ${chapter.vol} ` : ``}${
          chapter.chapter ? `Ch. ${chapter.chapter}` : ``
        }${chapter.title && (chapter.chapter || chapter.vol) ? ` - ` : ``}${
          chapter.title ? `${chapter.title}` : ``
        }`
    );

    dexChaptersJSON = dexChapters.map((chapter, index) => {
      const id = dexData.data.data[index].id;
      const label =
        (dexChapters[index] && dexChapters[index].slice(0, 100)) || "N/A";
      const description = id;
      const value = id;
      return {
        label,
        description,
        value,
      };
    });

    const paginate = (array, pageSize) => {
      const paginatedArray = [];
      for (let i = 0; i < array.length; i += pageSize) {
        paginatedArray.push(array.slice(i, i + pageSize));
      }
      return paginatedArray;
    };

    paginatedDexChaptersBold = paginate(dexChaptersBold, pageSize);
    paginatedDexChaptersJSON = paginate(dexChaptersJSON, pageSize);
  } else {
    paginatedDexChaptersBold = "***NO CHAPTER AVAILABLE.***";
    paginatedDexChaptersJSON = {
      label: "NO CHAPTER AVAILABLE",
      description: "sadge",
      value: "sadge",
    };
  }

  return {
    paginatedDexChaptersJSON,
    paginatedDexChaptersBold,
    dexData,
    dexChapters,
    chapters,
  };
}

function mapDexDataToJSON(dexData) {
  const dexTitlesJSON = dexData.data.data.map((manga, index) => {
    // Add or remove title keys as needed
    const possibleTitleKeys = ["en", "ja", "ja-ro"];
    const getTitle = (titles) => {
      return possibleTitleKeys.reduce((foundTitle, key) => {
        return foundTitle || titles[key];
      }, null);
    };
    let title = getTitle(manga.attributes.title);

    // Check if title empty or undefined
    if (!title && manga.attributes.altTitles) {
      title = getTitle(manga.attributes.altTitles);
    }

    const id = dexData.data.data[index].id;
    const label = (title && title.slice(0, 100)) || "N/A";
    const description = (id && `ID: ${id}`.slice(0, 100)) || "N/A";
    const value = (id && id.slice(0, 100)) || "N/A";
    return {
      label,
      description,
      value,
    };
  });

  return dexTitlesJSON;
}

async function fetchCoverData(dexData) {
  const cover_hash = dexData.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );
  return await getCover(cover_hash.id);
}

async function getMangaTitleAndCover(id) {
  const dexTitle = await getMangaInfo(id);
  const coverHash = dexTitle.data.data.relationships.find(
    (rel) => rel.type === "cover_art"
  );
  const coverData = await getCover(coverHash.id);
  const coverFilename = coverData.data.data.attributes.fileName;

  // Checking if title is empty or undefined
  const mangaData = dexTitle.data.data.attributes;
  const getTitle = (titles) => {
    const possibleTitleKeys = ["en", "ja", "ja-ro"];

    if (Array.isArray(titles)) {
      return titles.reduce(
        (foundTitle, titleObj) => getTitle(titleObj) || foundTitle,
        null
      );
    } else {
      return possibleTitleKeys.reduce(
        (foundTitle, key) => titles[key] || foundTitle,
        null
      );
    }
  };
  const title = getTitle(mangaData.title) || getTitle(mangaData.altTitles);
  const mangaTitle = title || "Untitled";

  return { mangaTitle, coverFilename };
}

module.exports = {
  getMangaTitleAndCover,
  getListChapters,
  getDataFromChapter,
  getMangaFromChapter,
  getMangaInfo,
  getLinkImage,
  getCover,
  fetchCoverData,
  searchManga,
  searchChapter,
  mapDexDataToJSON,
};
