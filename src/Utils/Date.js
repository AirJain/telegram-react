/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 */

const dateFormat = (function() {
    const token = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsAa])\1?|[LloSZWN]|"[^"]*"|'[^']*'/g;
    const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
    const timezoneClip = /[^-+\dA-Z]/g;

    // Regexes and supporting functions are cached through closure
    return function(date, mask, utc, gmt) {
        // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
        if (arguments.length === 1 && kindOf(date) === 'string' && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        date = date || new Date();

        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        if (isNaN(date)) {
            throw TypeError('Invalid date');
        }

        mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);

        // Allow setting the utc/gmt argument via the mask
        var maskSlice = mask.slice(0, 4);
        if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
            mask = mask.slice(4);
            utc = true;
            if (maskSlice === 'GMT:') {
                gmt = true;
            }
        }

        var _ = utc ? 'getUTC' : 'get';
        var d = date[_ + 'Date']();
        var D = date[_ + 'Day']();
        var M = date[_ + 'Month']();
        var y = date[_ + 'FullYear']();
        var H = date[_ + 'Hours']();
        var m = date[_ + 'Minutes']();
        var s = date[_ + 'Seconds']();
        var L = date[_ + 'Milliseconds']();
        var o = utc ? 0 : date.getTimezoneOffset();
        var W = getWeek(date);
        var N = getDayOfWeek(date);
        var flags = {
            d: d,
            dd: pad(d),
            ddd: dateFormat.i18n.dayNames[D],
            dddd: dateFormat.i18n.dayNames[D + 7],
            M: M + 1,
            MM: pad(M + 1),
            MMM: dateFormat.i18n.monthNames[M],
            MMMM: dateFormat.i18n.monthNames[M + 12],
            yy: String(y).slice(2),
            yyyy: y,
            h: H % 12 || 12,
            hh: pad(H % 12 || 12),
            H: H,
            HH: pad(H),
            m: m,
            mm: pad(m),
            s: s,
            ss: pad(s),
            l: pad(L, 3),
            L: pad(Math.round(L / 10)),
            a: H < 12 ? dateFormat.i18n.timeNames[0] : dateFormat.i18n.timeNames[1],
            aa: H < 12 ? dateFormat.i18n.timeNames[2] : dateFormat.i18n.timeNames[3],
            A: H < 12 ? dateFormat.i18n.timeNames[4] : dateFormat.i18n.timeNames[5],
            AA: H < 12 ? dateFormat.i18n.timeNames[6] : dateFormat.i18n.timeNames[7],
            Z: gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
            o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4),
            S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (((d % 100) - (d % 10) != 10) * d) % 10],
            W: W,
            N: N
        };

        return mask.replace(token, function(match) {
            if (match in flags) {
                return flags[match];
            }
            return match.slice(1, match.length - 1);
        });
    };
})();

dateFormat.masks = {
    default: 'ddd MMM dd yyyy HH:mm:ss',
    shortDate: 'M/d/yy',
    mediumDate: 'MMM d, yyyy',
    longDate: 'MMMM d, yyyy',
    fullDate: 'dddd, MMMM d, yyyy',
    shortTime: 'h:mm AA',
    mediumTime: 'h:mm:ss AA',
    longTime: 'h:mm:ss AA Z',
    isoDate: 'yyyy-MM-dd',
    isoTime: 'HH:mm:ss',
    isoDateTime: "yyyy-MM-dd'T'HH:mm:sso",
    isoUtcDateTime: "UTC:yyyy-MM-dd'T'HH:mm:ss'Z'",
    expiresHeaderFormat: 'ddd, dd MMM yyyy HH:mm:ss Z'
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ],
    monthNames: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    timeNames: ['AM', 'PM', 'AM', 'PM', 'AM', 'PM', 'AM', 'PM']
};

function pad(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) {
        val = '0' + val;
    }
    return val;
}

/**
 * Get the ISO 8601 week number
 * Based on comments from
 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getWeek(date) {
    // Remove time components of date
    var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Change date to Thursday same week
    targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

    // Take January 4th as it is always in week 1 (see ISO 8601)
    var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

    // Change date to Thursday same week
    firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

    // Check if daylight-saving-time-switch occurred and correct for it
    var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
    targetThursday.setHours(targetThursday.getHours() - ds);

    // Number of weeks between target Thursday and first Thursday
    var weekDiff = (targetThursday - firstThursday) / (86400000 * 7);
    return 1 + Math.floor(weekDiff);
}

/**
 * Get ISO-8601 numeric representation of the day of the week
 * 1 (for Monday) through 7 (for Sunday)
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getDayOfWeek(date) {
    var dow = date.getDay();
    if (dow === 0) {
        dow = 7;
    }
    return dow;
}

/**
 * kind-of shortcut
 * @param  {*} val
 * @return {String}
 */
function kindOf(val) {
    if (val === null) {
        return 'null';
    }

    if (val === undefined) {
        return 'undefined';
    }

    if (typeof val !== 'object') {
        return typeof val;
    }

    if (Array.isArray(val)) {
        return 'array';
    }

    return {}.toString
        .call(val)
        .slice(8, -1)
        .toLowerCase();
}

export default dateFormat;
