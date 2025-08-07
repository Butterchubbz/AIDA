// src/utils/forecasting.js

/**
 * Calculates the slope and intercept for a simple linear regression.
 * y = mx + b, where m is slope and b is intercept.
 * @param {number[]} y_values - The dependent variable (e.g., sales).
 * @param {number[]} x_values - The independent variable (e.g., time periods).
 * @returns {{slope: number, intercept: number}}
 */
export function simpleLinearRegression(y_values, x_values) {
    const n = y_values.length;
    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_xx = 0;

    for (let i = 0; i < n; i++) {
        sum_x += x_values[i];
        sum_y += y_values[i];
        sum_xy += x_values[i] * y_values[i];
        sum_xx += x_values[i] * x_values[i];
    }

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;

    return { slope, intercept };
}