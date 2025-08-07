import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDynamicInventory } from '../hooks/useDynamicInventory';
import { useMessageBox } from '../components/MessageBox';
import { simpleLinearRegression } from '../utils/forecasting';
import ForecastControls from './ForecastControls'; // Adjust import if needed
import ForecastAnalysisDisplay from './ForecastAnalysisDisplay'; // Adjust import if needed

const ForecastingView = () => {
    const { collectionName } = useParams();
    const { appConfig } = useAppContext();
    const { pb } = useAuth();
    const { showToast } = useMessageBox();
    const [forecastAnalysis, setForecastAnalysis] = useState(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Grouped state for forecasting parameters, initialized from appConfig
    const [forecastParams, setForecastParams] = useState({
        forecastWeeks: 8,
        historyWeeks: 8,
        leadTime: 4,
        safetyStock: 2,
    });

    useEffect(() => {
        if (appConfig?.forecasting) {
            setForecastParams({
                forecastWeeks: appConfig.forecasting.forecastWeeks || 8,
                historyWeeks: appConfig.forecasting.historyWeeks || 8,
                leadTime: appConfig.forecasting.leadTime || 4,
                safetyStock: appConfig.forecasting.safetyStock || 2,
            });
        }
    }, [appConfig]);

    // Load inventory items for the selected collection
    const { inventoryItems, loading } = useDynamicInventory(collectionName);

    const stockFields = useMemo(() => appConfig?.stockFields || [], [appConfig]);

    const handleItemSelect = (e) => {
        const item = inventoryItems.find(i => i.id === e.target.value);
        setSelectedItem(item);
        setForecastAnalysis(null); // Clear previous analysis when item changes
    };

    const handleParamsChange = (e) => {
        const { name, value } = e.target;
        setForecastParams(prev => ({
            ...prev,
            [name]: Number(value)
        }));
    };

    const handleGenerateForecast = async () => {
        if (!selectedItem) return;
        setIsForecasting(true);
        setForecastAnalysis(null);

        try {
            // Step 1: Fetch and prepare historical data
            const salesRecords = await pb.collection('salesData').getFullList({
                filter: `sku = "${selectedItem.sku}"`,
                sort: 'year,week',
            });

            const relevantHistory = salesRecords.slice(-forecastParams.historyWeeks);

            if (relevantHistory.length < 2) {
                showToast("Not enough sales data to forecast. Need at least 2 weeks of sales records.", "error");
                setIsForecasting(false);
                return;
            }

            // Prepare sales data for regression
            const salesData = relevantHistory.map((record, idx) => ({
                weekIndex: idx,
                sales: record.netSales,
                weekLabel: `Y${record.year}-W${record.week}`,
            }));

            // Step 2: Perform linear regression
            const y_values = salesData.map(d => d.sales);
            const x_values = salesData.map(d => d.weekIndex);
            const { slope, intercept } = simpleLinearRegression(x_values, y_values);

            // Step 3: Project future sales
            let cumulativeForecastSales = 0;
            let combinedChartData = [...salesData];
            const lastHistoricalWeekIndex = salesData[salesData.length - 1].weekIndex;
            let lastYear = relevantHistory[relevantHistory.length - 1].year;
            let lastWeek = relevantHistory[relevantHistory.length - 1].week;

            for (let i = 1; i <= forecastParams.forecastWeeks; i++) {
                const next_week_index = lastHistoricalWeekIndex + i;
                const predictedSales = Math.max(0, Math.round(slope * next_week_index + intercept));
                cumulativeForecastSales += predictedSales;
                combinedChartData.push({ weekLabel: `Forecast Y${lastYear}-W${lastWeek + i}`, Forecast: predictedSales });
            }

            // Step 4: Calculate key metrics and recommendation
            const avgWeeklySales = forecastParams.forecastWeeks > 0 ? cumulativeForecastSales / forecastParams.forecastWeeks : 0;
            const reorderPoint = Math.round((avgWeeklySales * forecastParams.leadTime) + (avgWeeklySales * forecastParams.safetyStock));
            const currentStock = stockFields.reduce((total, field) => total + (selectedItem[field.fieldName] || 0), 0);
            const recommendedOrderQty = Math.max(0, reorderPoint - currentStock);

            // Step 5: Set state with final analysis
            setForecastAnalysis({
                productName: selectedItem.name,
                chartData: combinedChartData,
                avgWeeklySales,
                currentStock,
                reorderPoint,
                recommendedOrderQty,
            });
        } catch (err) {
            showToast("Error generating forecast: " + err.message, "error");
        }
        setIsForecasting(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 bg-slate-800 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">Forecasting: {collectionName}</h2>
            <ForecastControls
                inventoryItems={inventoryItems}
                selectedItem={selectedItem}
                onItemSelect={handleItemSelect}
                params={forecastParams}
                onParamsChange={handleParamsChange}
                isForecasting={isForecasting}
            />
            <button
                onClick={handleGenerateForecast}
                disabled={!selectedItem || isForecasting}
                className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
                {isForecasting ? <><LoadingSpinner /> Generating...</> : 'Generate Forecast'}
            </button>
            {forecastAnalysis && <ForecastAnalysisDisplay analysis={forecastAnalysis} />}
        </div>
    );
};

export default ForecastingView;