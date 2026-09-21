import React, { useState, useMemo } from 'react';
import PageHeader from '../common/PageHeader';
import { formatINR } from '../../utils/propertyConstants';

/**
 * Reusable Financial Deal & EMI Calculators Panel
 */
export default function CalculatorsPanel({ badge = 'Sales Tools' }) {
  const [calcPrice, setCalcPrice] = useState('2500000');
  const [calcBrokeragePct, setCalcBrokeragePct] = useState(1);
  const [calcLoanAmount, setCalcLoanAmount] = useState('2000000');
  const [calcInterestRate, setCalcInterestRate] = useState(8.5);
  const [calcTenureYears, setCalcTenureYears] = useState(20);
  const [calcGajInput, setCalcGajInput] = useState('50');

  // Brokerage Commission Math
  const calculatedCommission = useMemo(() => {
    const p = Number(calcPrice) || 0;
    const gross = Math.round((p * calcBrokeragePct) / 100);
    const gst = Math.round(gross * 0.18);
    const totalWithGst = gross + gst;
    const agentPayout = Math.round(gross * 0.4);
    return { gross, gst, totalWithGst, agentPayout };
  }, [calcPrice, calcBrokeragePct]);

  // Loan EMI Math
  const calculatedEMI = useMemo(() => {
    const P = Number(calcLoanAmount) || 0;
    const r = (Number(calcInterestRate) || 8.5) / 12 / 100;
    const n = (Number(calcTenureYears) || 20) * 12;
    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, totalAmount: 0, totalInterest: 0 };
    const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const totalAmount = emi * n;
    const totalInterest = totalAmount - P;
    return { emi, totalAmount, totalInterest };
  }, [calcLoanAmount, calcInterestRate, calcTenureYears]);

  // Gaj to Sq.Ft & Sq.Yd Math
  const gajConversion = useMemo(() => {
    const gaj = Number(calcGajInput) || 0;
    const sqft = Math.round(gaj * 9);
    const sqyd = Math.round(gaj * 0.836127);
    const sqm = (gaj * 0.836127).toFixed(1);
    return { sqft, sqyd, sqm };
  }, [calcGajInput]);

  return (
    <div className="space-y-3.5 w-full">
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs">
        <PageHeader
          icon="ri-calculator-line"
          title="Financial Deal & EMI Calculators"
          subtitle="Compute brokerage commission, customer home loan EMI, and area unit conversions"
          badge={badge}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
        {/* 1. Brokerage Calculator */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
              <i className="ri-money-rupee-circle-line" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Brokerage Calculator</h3>
              <p className="text-[10px] text-slate-400">Sales commission split</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Deal Sale Price (₹)</label>
              <input
                type="number"
                value={calcPrice}
                onChange={(e) => setCalcPrice(e.target.value)}
                placeholder="2500000"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none"
              />
              <span className="text-[10px] text-orange-600 font-bold block mt-0.5">
                {formatINR(calcPrice)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Brokerage %</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 1.5, 2].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCalcBrokeragePct(pct)}
                    className={`py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      calcBrokeragePct === pct
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Gross Brokerage:</span>
                <span className="font-bold text-slate-900">{formatINR(calculatedCommission.gross)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>GST (18%):</span>
                <span className="font-bold text-slate-700">{formatINR(calculatedCommission.gst)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                <span>Agent Payout (40%):</span>
                <span className="font-black text-sm">{formatINR(calculatedCommission.agentPayout)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Client EMI Estimator */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
              <i className="ri-bank-line" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Home Loan EMI Estimator</h3>
              <p className="text-[10px] text-slate-400">Monthly repayment preview</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Loan Amount (₹)</label>
              <input
                type="number"
                value={calcLoanAmount}
                onChange={(e) => setCalcLoanAmount(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcInterestRate}
                  onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Tenure (Years)</label>
                <input
                  type="number"
                  value={calcTenureYears}
                  onChange={(e) => setCalcTenureYears(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/70 space-y-1 text-xs text-blue-950">
              <span className="text-[10px] font-black uppercase text-blue-700 block">Monthly Loan EMI</span>
              <span className="text-base font-black text-blue-700 block">
                ₹ {calculatedEMI.emi.toLocaleString('en-IN')} / month
              </span>
              <div className="flex justify-between text-[10px] pt-0.5 text-slate-600">
                <span>Total Interest:</span>
                <span className="font-bold">{formatINR(calculatedEMI.totalInterest)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Gaj / Land Unit Converter */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="h-6 w-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs">
              <i className="ri-ruler-2-line" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">Gaj & Land Unit Converter</h3>
              <p className="text-[10px] text-slate-400">Delhi NCR land conversions</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Enter Area in Gaj (Gaz)</label>
              <input
                type="number"
                value={calcGajInput}
                onChange={(e) => setCalcGajInput(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-black text-purple-700 text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600">Square Feet (Sq.Ft):</span>
                <span className="font-black text-xs text-slate-900">{gajConversion.sqft} sq.ft</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600">Square Yards (Sq.Yd):</span>
                <span className="font-black text-xs text-slate-900">{gajConversion.sqyd} sq.yd</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-600">Square Meters (Sq.M):</span>
                <span className="font-black text-xs text-slate-900">{gajConversion.sqm} sq.m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
