import CompanyCard from './CompanyCard';

/**
 * CompanyCardPreview Component
 * 
 * Displays a live preview of how the company card will look
 * based on form data being filled by the user.
 * 
 * @param {Object} formData - Current form values
 * @param {string} customColor - Custom brand color for the card
 */
const CompanyCardPreview = ({ formData = {}, customColor = '#1a27c9' }) => {
    // Extract core fields from form data
    const previewData = {
        startup_name: formData.startup_name || '',
        logo_url: formData.logo_url || '',
        industry: formData.industry || '',
        location: formData.location || '',

        // Additional fields that might be displayed
        ...formData
    };

    // Check if we have minimum required data
    const hasMinimumData = previewData.startup_name;

    return (
        <div className="space-y-4">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Live Preview</h3>
                    <p className="text-xs text-slate-500">This is how your card will appear</p>
                </div>
                {!hasMinimumData && (
                    <div className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                        Fill required fields
                    </div>
                )}
            </div>

            {/* Card Preview */}
            <div className="bg-slate-100 rounded-[3rem] p-6 border border-slate-200 overflow-hidden">
                {hasMinimumData ? (
                    <div className="flex justify-center bg-slate-100/50 py-8 rounded-[2rem]">
                        <div className="origin-top transform transition-all scale-50 md:scale-100">
                            <CompanyCard
                                company={previewData}
                                customColor={customColor}
                                viewMode="list"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-600">Fill in the form to see your preview</p>
                        <p className="text-xs text-slate-400 mt-1">Start with company name to see the magic ✨</p>
                    </div>
                )}
            </div>

            {/* Field Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Required Fields</h4>
                <div className="space-y-2">
                    <ChecklistItem
                        label="Company Name"
                        completed={!!previewData.startup_name}
                    />
                    <ChecklistItem
                        label="Industry"
                        completed={!!previewData.industry}
                        optional
                    />
                    <ChecklistItem
                        label="Logo"
                        completed={!!previewData.logo_url}
                        optional
                    />
                    <ChecklistItem
                        label="Location"
                        completed={!!previewData.location}
                        optional
                    />
                </div>
            </div>
        </div>
    );
};

const ChecklistItem = ({ label, completed, optional }) => (
    <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${completed
            ? 'bg-green-500 border-green-500'
            : optional
                ? 'border-slate-300 bg-white'
                : 'border-blue-500 bg-white'
            }`}>
            {completed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <span className={`text-sm ${completed ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
            {label}
            {optional && <span className="text-xs text-slate-400 ml-1">(optional)</span>}
        </span>
    </div>
);

export default CompanyCardPreview;
