import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase, ref, child, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #e0e0e0;
  min-width: 250px;
  position: relative;
`;

const Title = styled.h3`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CostDisplay = styled.div`
  font-size: 2.2rem;
  font-weight: 700;
  color: ${props => props.$isZero ? '#4caf50' : props.$isHigh ? '#d32f2f' : '#1565c0'};
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

const Currency = styled.span`
  font-size: 1rem;
  color: #888;
  font-weight: 500;
`;

const StatusMessage = styled.div`
  font-size: 0.8rem;
  color: ${props => props.$error ? '#d32f2f' : '#888'};
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #1976d2;
  font-size: 1.2rem;
  padding: 0;
  transition: transform 0.2s;
  &:hover {
    transform: rotate(90deg);
  }
  &:disabled {
    color: #ccc;
    cursor: default;
  }
`;

const BillingCard = ({ firebaseApp }) => {
    const [costData, setCostData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usageData, setUsageData] = useState([]);
    const [usageLoading, setUsageLoading] = useState(false);
    const [estimatedTotal, setEstimatedTotal] = useState(null);
    const [combinedChartData, setCombinedChartData] = useState([]);

    const fetchBilling = async () => {
        setLoading(true);
        setError(null);
        try {
            const functions = getFunctions(firebaseApp);
            const getBillingAmount = httpsCallable(functions, 'getBillingAmount');
            const result = await getBillingAmount();
            setCostData(result.data);
            return result.data;
        } catch (err) {
            console.error("Error fetching billing:", err);
            setError(err.message || "Error al cargar facturación");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageLogs = async (billingData) => {
        setUsageLoading(true);
        const db = getDatabase(firebaseApp);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const daysInMonth = new Date(yyyy, today.getMonth() + 1, 0).getDate();

        let lastBilledDateStr = '';

        if (billingData && billingData.dailyTrend && billingData.dailyTrend.length > 0) {
            const lastEntry = billingData.dailyTrend[billingData.dailyTrend.length - 1];
            lastBilledDateStr = lastEntry.date;
        } else if (billingData && billingData.lastUpdated) {
            const d = new Date(billingData.lastUpdated);
            lastBilledDateStr = d.toISOString().split('T')[0];
        }

        const usageMap = {};
        const localDailyMap = {};
        let totalUnbilled = 0;

        try {
            const auth = getAuth(firebaseApp);
            if (!auth.currentUser) {
                console.warn("User not authenticated. Skipping usage logs fetch.");
                setUsageLoading(false);
                return;
            }

            const promises = [];
            for (let d = 1; d <= daysInMonth; d++) {
                const dayStr = `${yyyy}-${mm}-${String(d).padStart(2, '0')}`;
                promises.push(get(child(ref(db), `usage_logs/${dayStr}`)).then(snap => ({ date: dayStr, val: snap.val() })));
            }

            const results = await Promise.all(promises);

            results.forEach(({ date, val }) => {
                if (!val) return;

                const isUnbilled = !lastBilledDateStr || date > lastBilledDateStr;
                let dayTotal = 0;

                Object.keys(val).forEach(featureId => {
                    const data = val[featureId];
                    if (!usageMap[featureId]) {
                        usageMap[featureId] = {
                            name: featureId.replace('agent_', 'Agente: ').replace('news_', 'Noticias: ').replace(/_/g, ' '),
                            totalTokens: 0,
                            estimatedCost: 0,
                        };
                    }

                    usageMap[featureId].totalTokens += (data.totalTokens || 0);

                    const P_IN_FLASH = 0.075;
                    const P_OUT_FLASH = 0.30;
                    const P_IN_PRO = 3.50;
                    const P_OUT_PRO = 10.50;

                    const isPro = (data.model || '').includes('pro') || (data.model || '').includes('2.5');
                    const priceIn = isPro ? P_IN_PRO : P_IN_FLASH;
                    const priceOut = isPro ? P_OUT_PRO : P_OUT_FLASH;

                    const cost = ((data.promptTokens || 0) / 1000000) * priceIn + ((data.candidateTokens || 0) / 1000000) * priceOut;

                    usageMap[featureId].estimatedCost += cost;
                    dayTotal += cost;

                    if (isUnbilled) {
                        totalUnbilled += cost;
                    }
                });

                localDailyMap[date] = dayTotal;
            });

            setUsageData(Object.values(usageMap).sort((a, b) => b.estimatedCost - a.estimatedCost));

            if (billingData && billingData.amount) {
                const currentTotal = parseFloat(billingData.amount);
                setEstimatedTotal(currentTotal + totalUnbilled);
            }

            let mergedChartData = [...(billingData.dailyTrend || [])];

            Object.keys(localDailyMap).sort().forEach(date => {
                if (!lastBilledDateStr || date > lastBilledDateStr) {
                    if (!mergedChartData.find(d => d.date === date)) {
                        mergedChartData.push({
                            date: date,
                            amount: parseFloat(localDailyMap[date].toFixed(4)),
                            isEstimated: true
                        });
                    }
                }
            });

            setCombinedChartData(mergedChartData);

        } catch (e) {
            console.error("Error fetching usage logs:", e);
        } finally {
            setUsageLoading(false);
        }
    };

    useEffect(() => {
        fetchBilling().then(data => {
            if (data) fetchUsageLogs(data);
        });
    }, []);

    const isHighCost = costData && parseFloat(costData.amount) > 50;

    return (
        <Card>
            <Title>
                Costo Mensual (GCP)
                <RefreshButton onClick={() => { fetchBilling().then(d => d && fetchUsageLogs(d)); }} disabled={loading || usageLoading} title="Actualizar">
                    {loading ? '...' : '↻'}
                </RefreshButton>
            </Title>

            {loading && !costData ? (
                <div style={{ padding: '20px 0', color: '#888' }}>Cargando datos...</div>
            ) : error ? (
                <StatusMessage $error>
                    ⚠️ {error}
                </StatusMessage>
            ) : costData ? (
                <>
                    <div style={{ marginBottom: '10px' }}>
                        <CostDisplay $isZero={parseFloat(costData.amount) === 0} $isHigh={isHighCost}>
                            {costData.amount}
                            <Currency>{costData.currencyCode}</Currency>
                            <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: '400', marginLeft: '5px' }}>(Facturado)</span>
                        </CostDisplay>

                        {estimatedTotal !== null && estimatedTotal > parseFloat(costData.amount) && (
                            <div style={{ fontSize: '1.1rem', color: '#f57f17', fontWeight: '600', marginTop: '-5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                ~ {estimatedTotal.toFixed(2)} USD
                                <span style={{ fontSize: '0.7rem', color: '#f9a825', fontWeight: '400' }}>(Estimado Real)</span>
                            </div>
                        )}
                    </div>

                    {costData.lastUpdated && (
                        <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '5px' }}>
                            Actualizado: {new Date(costData.lastUpdated).toLocaleString()}
                        </div>
                    )}

                    {costData.budgetName && (
                        <StatusMessage>
                            Presupuesto: {costData.budgetName.split('/').pop()}
                        </StatusMessage>
                    )}

                    {costData.breakdown && costData.breakdown.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', width: '100%' }}>
                            <div style={{ fontWeight: '500', marginBottom: '5px', color: '#555' }}>Desglose (Facturado):</div>
                            {costData.breakdown.slice(0, 5).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#666' }}>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }} title={item.service}>
                                        {item.service}
                                    </span>
                                    <span>${item.amount}</span>
                                </div>
                            ))}
                            {costData.breakdown.length > 5 && (
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '3px' }}>
                                    + {costData.breakdown.length - 5} más...
                                </div>
                            )}
                        </div>
                    )}

                    {usageData.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #dae0e5', paddingTop: '10px', fontSize: '0.85rem', width: '100%', backgroundColor: '#fff8e1', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#f57f17', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'space-between' }}>
                                <span>⚡ Estimación Uso (Mes Actual)</span>
                            </div>

                            <div style={{ fontSize: '0.7rem', color: '#f9a825', marginBottom: '8px', lineHeight: '1.2' }}>
                                Uso calculado desde logs locales.<br />
                                <span style={{ fontStyle: 'italic' }}>* Se suma al total global si es posterior al último cobro.</span>
                            </div>

                            {usageData.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px dotted #ffe0b2', paddingBottom: '3px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: '#ef6c00', fontWeight: '500', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                            {item.name}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#ffcc80' }}>
                                            {(item.totalTokens / 1000).toFixed(1)}k tokens
                                        </span>
                                    </div>
                                    <span style={{ fontWeight: '600', color: '#e65100' }}>
                                        ${item.estimatedCost.toFixed(4)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {costData.history && costData.history.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '0.85rem', width: '100%' }}>
                            <div style={{ fontWeight: '500', marginBottom: '5px', color: '#555' }}>Historial:</div>
                            {costData.history.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#666' }}>
                                    <span>{item.month}</span>
                                    <span style={{ color: parseFloat(item.amount) > 0 ? '#1565c0' : '#888' }}>${item.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {costData.previousMonthBreakdown && costData.previousMonthBreakdown.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '0.85rem', width: '100%', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '5px', color: '#555' }}>Desglose Mes Anterior:</div>
                            {costData.previousMonthBreakdown.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#666' }}>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%', fontSize: '0.8rem' }} title={item.service}>
                                        {item.service}
                                    </span>
                                    <span style={{ fontSize: '0.8rem' }}>${item.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {costData.geminiBreakdown && costData.geminiBreakdown.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #dae0e5', paddingTop: '10px', fontSize: '0.85rem', width: '100%', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1565c0', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'space-between' }}>
                                <span>✨ Detalle Gemini API</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: '400', color: '#546e7a' }}>Mes Anterior</span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#0277bd', marginBottom: '10px', fontStyle: 'italic', padding: '5px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                💡 "Output token count" se refiere a la cantidad de texto generado por la IA en tus aplicaciones.
                            </div>

                            {costData.geminiBreakdown.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px', paddingBottom: '8px', borderBottom: idx < costData.geminiBreakdown.length - 1 ? '1px dashed #bbdefb' : 'none' }}>

                                    {item.project && (
                                        <div style={{ fontSize: '0.7rem', color: '#78909c', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Project: {item.project}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0d47a1', fontWeight: '500', fontSize: '0.8rem' }}>
                                        <span title={item.sku} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                            {item.sku.replace('Generate content ', '').replace('Gemini ', '')}
                                        </span>
                                        <span>${item.amount}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#546e7a', marginTop: '2px' }}>
                                        Uso: {item.usage} {item.unit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {combinedChartData.length > 0 && (
                        <div style={{ marginTop: '15px', borderTop: '1px solid #dae0e5', paddingTop: '10px', width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#fff' }}>
                            <div style={{ fontWeight: '600', marginBottom: '10px', color: '#1565c0', fontSize: '0.85rem' }}>
                                📊 Tendencia Diaria (Últimos 60 días)
                            </div>
                            <div style={{ width: '100%', height: 150 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={combinedChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            tickFormatter={(val) => {
                                                const parts = val.split('-');
                                                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                                return val;
                                            }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            formatter={(value, name, props) => {
                                                const isEst = props.payload.isEstimated;
                                                return [`$${value} ${isEst ? '(Est.)' : ''}`, 'Costo'];
                                            }}
                                            labelFormatter={(label) => {
                                                const parts = label.split('-');
                                                if (parts.length === 3) return `Fecha: ${parts[2]}/${parts[1]}/${parts[0]}`;
                                                return `Fecha: ${label}`;
                                            }}
                                            contentStyle={{ fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                        />
                                        <Bar dataKey="amount" fill="#4285F4" radius={[4, 4, 0, 0]}>
                                            {combinedChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.amount > 5 ? '#EA4335' : (entry.isEstimated ? '#FFB74D' : '#4285F4')} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {costData && costData.status === 'permission_denied' && (
                        <StatusMessage $error>
                            🔒 {costData.message}
                        </StatusMessage>
                    )}

                    {costData && costData.status === 'no_dataset' && (
                        <StatusMessage $error title={costData.message}>
                            ⚠️ Falta configurar BigQuery Export
                        </StatusMessage>
                    )}

                    {costData && costData.status === 'no_table' && (
                        <StatusMessage title={costData.message}>
                            🕒 Esperando datos de exportación...
                        </StatusMessage>
                    )}

                    {costData && costData.status === 'error' && (
                        <StatusMessage $error>
                            ⚠️ {costData.message}
                        </StatusMessage>
                    )}

                    {costData && costData.status === 'error_not_found' && (
                        <StatusMessage $error>
                            ⚠️ Dataset no encontrado
                        </StatusMessage>
                    )}

                    {costData && costData.status === 'no_billing_account' && (
                        <StatusMessage>Sin cuenta de facturación vinculada</StatusMessage>
                    )}
                </>
            ) : null}

            <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Datos aprox.</span>
                <a
                    href="https://console.cloud.google.com/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2', textDecoration: 'none', fontWeight: '500' }}
                >
                    Ver en Google Cloud ↗
                </a>
            </div>
        </Card>
    );
};

export default BillingCard;
