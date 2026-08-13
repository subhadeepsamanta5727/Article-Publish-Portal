const Article = require("../Models/Article");

const generateArticleId = async () => {
  const year = new Date().getFullYear();

  const lastArticle = await Article.findOne({
    articleId: new RegExp(`^ART-${year}-`),
  })
    .sort({ createdAt: -1 })
    .select("articleId");

  let nextNumber = 1;

  if (lastArticle) {
    const lastNumber = parseInt(
      lastArticle.articleId.split("-")[2],
      10
    );

    nextNumber = lastNumber + 1;
  }

  return `ART-${year}-${String(nextNumber).padStart(6, "0")}`;
};

module.exports = generateArticleId;
