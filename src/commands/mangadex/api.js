const axios = require("axios");
const { MANGADEX_ENDPOINT } = require("./constants");

async function getMangaFromChapter(id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/chapter/${id}`,
  });

  return resp.data.data.relationships.find((rel) => rel.type === "manga").id;
}

async function searchManga(title) {
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
}

async function getLinkImage(chapterID) {
  const baseUrl = "https://api.mangadex.org";

  const resp = await axios({
    method: "GET",
    url: `${baseUrl}/at-home/server/${chapterID}`,
  });

  return resp;
}

async function searchChapter(title_id) {
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
}

async function getMangaInfo(title_id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/manga/${title_id}`,
  });

  return resp;
}

async function getCover(title_id) {
  const resp = await axios({
    method: "GET",
    url: `${MANGADEX_ENDPOINT}/cover/${title_id}`,
  });

  return resp;
}

async function getDataFromChapter(chapter_id) {
  const manga_id = await getMangaFromChapter(chapter_id);
  const dexTitle = await getMangaInfo(manga_id);
  const dexData = await searchChapter(manga_id);

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
    mangaID: manga_id,
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

    dexChaptersJSON = dexChapters.slice(0, 25).map((chapter, index) => {
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
    const title = manga.attributes.title.en;
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
  const mangaTitle = dexTitle.data.data.attributes.title.en;

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
