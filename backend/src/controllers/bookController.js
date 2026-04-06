const { getBookById: getBookByIdService } = require("../services/bookService");

async function getBookById(req, res) {
  try {
    const { id } = req.params;

    const book = await getBookByIdService(Number(id)); // convert

    return res.status(200).json({
      success: true,
      message: `Book with id ${id} found successfully`,
      data: book,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error retrieving book",
    });
  }
}

module.exports = {
  getBookById,
};
