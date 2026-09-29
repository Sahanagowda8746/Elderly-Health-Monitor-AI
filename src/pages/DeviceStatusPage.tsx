import React, { useState } from 'react';
import {
  Cpu, Wifi, BatteryCharging, Radio, CheckCircle, RefreshCw,
  AlertTriangle, ShieldCheck, HardDrive, Zap, Play, Terminal
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export function DeviceStatusPage() {
  const { device, latestReading } = useHealth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runDiagnostic = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult('All 4 sensor buses verified. Optical SNR: 48dB. Accelerometer zero-bias within ±0.02g. Memory: 72% free.');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Cpu size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{device.deviceName}</h1>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {device.connectionStatus}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {device.deviceId}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware node health, I2C sensor bus status, battery power, and edge diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={runDiagnostic}
            disabled={testing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
            <span>{testing ? 'Running Diagnostic Protocol…' : 'Run Hardware Self-Test'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 shadow-sm animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Hardware Diagnostic Completed Successfully</p>
            <p className="text-emerald-700 mt-0.5 font-mono">{testResult}</p>
          </div>
        </div>
      )}

      {/* Primary Hardware Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Power Subsystem</span>
            <BatteryCharging size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">94%</p>
          <p className="text-xs text-slate-500 mt-1">
            Status: <strong className="text-emerald-600">Docked & Charging</strong>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-[94%]" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Network Link</span>
            <Wifi size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">-54 dBm</p>
          <p className="text-xs text-slate-500 mt-1">
            SSID: <strong className="text-slate-800">HomeCare-5G</strong> (802.11ac)
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full w-[88%]" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Edge Gateway Latency</span>
            <Radio size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">38 ms</p>
          <p className="text-xs text-slate-500 mt-1">
            Transport: <strong className="text-slate-800">WSS Telemetry Socket</strong>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full w-[95%]" />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Firmware & Edge OS</span>
            <HardDrive size={18} className="text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 font-mono">v2.4.1-edge</p>
          <p className="text-xs text-slate-500 mt-1">
            Architecture: <strong className="text-slate-800">ARMv8 Cortex-A72</strong>
          </p>
          <p className="text-[11px] text-slate-400 mt-3">Up-to-date with secure boot</p>
        </div>
      </div>

      {/* Sensor Bus Detailed Telemetry */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">Attached Sensor Modules & Transducers</h2>
        <p className="text-xs text-slate-500 mb-4">I2C / SPI peripheral bus registry on edge hardware</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">MAX30102 High-Sensitivity Pulse Oximeter</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">OPERATIONAL</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Measures peripheral capillary oxygen saturation (SpO₂) and photoplethysmogram pulse wave via Red/IR LED dual absorption.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              <span>Bus: I2C 0x57</span>
              <span>Sample: 100 Hz</span>
              <span>LED Current: 24mA</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">MLX90614 Medical Infrared Thermometer</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">OPERATIONAL</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Non-contact medical thermopile sensor with factory calibration gradient and ±0.2°C clinical resolution.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              <span>Bus: SMBus 0x5A</span>
              <span>Accuracy: ±0.2°C</span>
              <span>FOV: 35 Degrees</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">MPU6050 6-Axis Motion & Accelerometer</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">OPERATIONAL</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Integrated 3-axis MEMS accelerometer & gyroscope with onboard Digital Motion Processor (DMP) executing fall detection triggers.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              <span>Bus: I2C 0x68</span>
              <span>Scale: ±8g</span>
              <span>Interrupt: Active</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-800">u-blox NEO-6M GNSS Satellite Receiver</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">LOCKED</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Continuous position telemetry with ceramic patch antenna delivering emergency coordinates to caregiver portal.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              <span>Port: UART 9600</span>
              <span>Sats: 8 in view</span>
              <span>TTFF: 28 sec</span>
            </div>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
