import mongoose from "mongoose";

// Shared CRUD helper for the POS resources.
// Each resource uses a business "id" field (Number for products/customers/
// suppliers, String for sales) instead of the Mongo "_id".
export function makeCrud(model, options = {}) {
  const { idField = "id", generateId } = options;

  async function assignId(body) {
    const current = body[idField];
    if (current !== undefined && current !== null && current !== "") return;
    if (generateId) {
      body[idField] = generateId();
      return;
    }
    const last = await model
      .findOne()
      .sort({ [idField]: -1 })
      .select(idField)
      .lean();
    body[idField] = last ? Number(last[idField]) + 1 : 1;
  }

  return {
    async list() {
      return model.find().sort({ [idField]: 1 }).lean();
    },

    async create(data) {
      const body = { ...data };
      await assignId(body);
      const doc = await model.create(body);
      return doc.toObject();
    },

    async update(id, data) {
      const body = { ...data };
      // The business id is immutable once created.
      delete body[idField];
      delete body._id;
      const doc = await model
        .findOneAndUpdate({ [idField]: id }, body, {
          new: true,
          runValidators: true,
        })
        .lean();
      return doc;
    },

    async remove(id) {
      const result = await model.deleteOne({ [idField]: id });
      return result.deletedCount > 0;
    },
  };
}