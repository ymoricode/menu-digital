import barcodeService from "../services/barcode.service.js";

/**
 * Barcodes controller
 */
export const getAll = async (req, res) => {
  try {
    const barcodes = await barcodeService.getAll();

    res.json({
      success: true,
      data: barcodes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get barcodes",
    });
  }
};

/**
 * mengambil barcode berdasarkan nomor meja
 */
export const getByTableNumber = async (req, res) => {
  try {
    const { table_number } = req.params;
    const barcode = await barcodeService.getByTableNumber(table_number);

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found for this table",
      });
    }

    res.json({
      success: true,
      data: barcode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get barcode",
    });
  }
};

/**
 * mengambil barcode berdasarkan id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const barcode = await barcodeService.getById(parseInt(id));

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found",
      });
    }

    res.json({
      success: true,
      data: barcode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get barcode",
    });
  }
};

/**
 * Menambah barcode baru
 */
export const create = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    const userId = req.user?.id;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Table number is required",
      });
    }

    // check if barcode for the table number already exists
    const existing = await barcodeService.getByTableNumber(tableNumber);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Barcode for this table number already exists",
      });
    }

    const barcode = await barcodeService.create({ tableNumber }, userId);

    res.status(201).json({
      success: true,
      message: "Barcode created successfully",
      data: barcode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create barcode",
    });
  }
};

/**
 * Edit Barcode
 */
export const regenerate = async (req, res) => {
  try {
    const { id } = req.params;
    const barcode = await barcodeService.regenerateQR(parseInt(id));

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found",
      });
    }

    res.json({
      success: true,
      message: "QR code regenerated successfully",
      data: barcode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to regenerate QR code",
    });
  }
};

/**
 * Delete barcode
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const barcode = await barcodeService.remove(parseInt(id));

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found",
      });
    }

    res.json({
      success: true,
      message: "Barcode deleted successfully",
      data: barcode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete barcode",
    });
  }
};

export default {
  getAll,
  getByTableNumber,
  getById,
  create,
  regenerate,
  remove,
};
