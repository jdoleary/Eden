export const timeAgoJs = `
// Automatically converts the innerText of any element with data-converttimeago milliseconds
// to the format "X {time} ago"
const dataname = 'converttimeago'
for(const el of document.querySelectorAll('[data-'+dataname+']')){
    el.innerText = timeAgo(new Date(parseInt(el.dataset[dataname],10)));
}
function timeAgo(date) {
    const delta = Date.now() - date.getTime();
    const dMinutes = delta / 60_000;
    const dHours = dMinutes / 60;
    const dDays = dHours / 24;
    const dMonths = dDays / 30.44;
    const dYears = dDays / 365.25;

    if (dYears >= 1) {
        return dYears === 1 ? "1 year ago" : Math.floor(dYears)+ '  years ago';
    } else if (dMonths >= 1) {
        return dMonths === 1 ? "1 month ago" : Math.floor(dMonths)+ '  months ago';
    } else if (dDays >= 1) {
        return dDays === 1 ? "1 day ago" : Math.floor(dDays)+ '  days ago';
    } else if (dHours >= 1) {
        return dHours === 1 ? "1 hour ago" : Math.floor(dHours)+ '  hours ago';
    } else {
        return dMinutes < 1 ? "just now" :
            dMinutes === 1 ? "1 minute ago" :
                Math.floor(dMinutes) + ' minutes ago';
    }
}
`;