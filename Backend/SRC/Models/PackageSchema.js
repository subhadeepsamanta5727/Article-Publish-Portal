const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
    {
        packageId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        packageName: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        mediaCoverage: [
            {
                publisherName: {
                    type: String,
                    required: true,
                    trim: true,
                },

                sampleReportLink: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],

        costPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        margin: {
            type: Number,
            required: true,
            min: 0,
        },

        marginCategory: {
            type: String,
            enum: ["amount", "percentage"],
            required: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
            uppercase: true,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

packageSchema.index({
    category: 1,
    isActive: 1,
});

module.exports = mongoose.model("Package", packageSchema);