// src/utils/csvParser.js

/**
 * Parses a CSV string into an array of objects.
 * Assumes the first row is the header.
 * @param {string} csvString The CSV content as a string.
 * @returns {Array<Object>} An array of objects.
 */
export const parseCsv = (csvString) => {
    const lines = csvString.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
        return []; // Not enough data to parse
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines

        const values = line.split(',');
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = values[index] ? values[index].trim() : '';
        });
        data.push(entry);
    }

    return data;
};

/**
 * Reads a file object and parses it as CSV.
 * @param {File} file The file object from an input element.
 * @returns {Promise<Array<Object>>} A promise that resolves with the parsed data.
 */
export const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(parseCsv(event.target.result));
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};