export function ProductionMetrics() {
    return (
        <div className="h-full flex items-center justify-center p-10">
            <div className="max-w-md w-full text-center bg-black/30 border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/40 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center text-white/60">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Metrics in Progress</h2>
                    <p className="text-sm text-white/60">This section is under development and requires integration with your company analytics systems.</p>
                </div>
                <div className="text-xs text-white/40 space-y-1">
                    <div>Planned signals:</div>
                    <div className="flex flex-col gap-1 text-white/50">
                        <span>• Accept rate / rejection rate</span>
                        <span>• Latency &amp; time-to-resolution</span>
                        <span>• Usage volume per prompt/version</span>
                        <span>• Active deployments &amp; health</span>
                        <span>• Alerts and error budgets</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
