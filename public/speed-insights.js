/**
 * Vercel Speed Insights Integration
 * This file handles the initialization and configuration of Vercel Speed Insights
 * 
 * Speed Insights automatically sends Web Vitals data to Vercel
 * No additional action needed - the /_vercel/speed-insights/script.js handles everything
 */

// Optional: Add a beforeSend hook for data sanitization
// This is called before Speed Insights sends data to Vercel
window.speedInsightsBeforeSend = function(data) {
    // Sanitize URLs to remove sensitive information if needed
    if (data && data.url) {
        try {
            const url = new URL(data.url, window.location.origin);
            
            // Remove sensitive query parameters if present
            // Example sensitive parameters to remove:
            const sensitiveParams = ['token', 'api_key', 'secret', 'session_id'];
            sensitiveParams.forEach(param => {
                if (url.searchParams.has(param)) {
                    url.searchParams.delete(param);
                }
            });
            
            data.url = url.toString();
        } catch (e) {
            console.warn('Could not parse URL for Speed Insights:', e);
        }
    }
    
    // You can also add custom tracking data here
    // For example, track custom user properties or feature flags
    
    return data;
};

// Log that Speed Insights is configured
if (typeof console !== 'undefined' && console.log) {
    console.log('[Vercel Speed Insights] Initialized and ready to track Web Vitals');
}
