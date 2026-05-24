const getDateTimePartsInZone = (date, timezone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);

    return parts.reduce((result, part) => {
        if (part.type !== 'literal') result[part.type] = Number(part.value);
        return result;
    }, {});
};

const partsToUtcMs = (parts) => Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second || 0),
    0
);

const parseLocalDateTimeInZone = (dateStr, timeStr, timezone) => {
    const [year, month, day] = String(dateStr || '').split('-').map(Number);
    const [hour, minute] = String(timeStr || '').split(':').map(Number);
    const tz = String(timezone || 'UTC').trim() || 'UTC';

    if (![year, month, day, hour, minute].every(Number.isFinite)) {
        return new Date(Number.NaN);
    }

    const desiredUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    let guessMs = desiredUtcMs;

    for (let i = 0; i < 3; i += 1) {
        const actualParts = getDateTimePartsInZone(new Date(guessMs), tz);
        const actualUtcMs = partsToUtcMs(actualParts);
        const diffMs = desiredUtcMs - actualUtcMs;
        if (diffMs === 0) break;
        guessMs += diffMs;
    }

    return new Date(guessMs);
};

const buildPublicDeliverySlotQuery = (now = new Date()) => ({
    active: true,
    endAt: { $gte: now }
});

const isFutureDeliverySlotRange = ({ startAt, endAt }, now = new Date()) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const cutoff = new Date(now);
    return Number.isFinite(start.getTime())
        && Number.isFinite(end.getTime())
        && Number.isFinite(cutoff.getTime())
        && end > start
        && end > cutoff;
};

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

const normalizeDeliverySlotId = (value) => {
    const baseId = String(value || '').trim().split(':')[0] || '';
    return OBJECT_ID_PATTERN.test(baseId) ? baseId : '';
};

const pad2 = (value) => String(value).padStart(2, '0');

const formatDateKeyInTimezone = (value, timezone) => {
    const parts = getDateTimePartsInZone(new Date(value), timezone);
    return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

const formatDateLabelInTimezone = (value, timezone) => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: String(timezone || 'UTC'),
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).format(new Date(value));
    } catch {
        return '';
    }
};

const formatTimeRangeInTimezone = (startValue, endValue, timezone) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: String(timezone || 'UTC'),
            hour: 'numeric',
            minute: '2-digit'
        });
        return `${formatter.format(new Date(startValue))} - ${formatter.format(new Date(endValue))}`;
    } catch {
        return '';
    }
};

const addDaysToDateKey = (dateKey, days) => {
    const [year, month, day] = String(dateKey || '').split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0));
    return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
};

const splitSlotForTimezone = ({ id, startAt, endAt, timezone }) => {
    const slotId = String(id || '');
    const tz = String(timezone || 'UTC').trim() || 'UTC';
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (!slotId || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
        return [];
    }

    const segments = [];
    let segmentStart = start;
    for (let index = 0; index < 8 && segmentStart < end; index += 1) {
        const dateKey = formatDateKeyInTimezone(segmentStart, tz);
        const nextDateKey = addDaysToDateKey(dateKey, 1);
        const nextMidnight = parseLocalDateTimeInZone(nextDateKey, '00:00', tz);
        const segmentEnd = nextMidnight > segmentStart && nextMidnight < end ? nextMidnight : end;

        segments.push({
            id: `${slotId}:${dateKey}:${index}`,
            slotId,
            customerDateKey: dateKey,
            customerDateLabel: formatDateLabelInTimezone(segmentStart, tz),
            customerTimeLabel: formatTimeRangeInTimezone(segmentStart, segmentEnd, tz)
        });

        if (segmentEnd >= end) break;
        segmentStart = segmentEnd;
    }

    return segments;
};

module.exports = {
    buildPublicDeliverySlotQuery,
    isFutureDeliverySlotRange,
    normalizeDeliverySlotId,
    parseLocalDateTimeInZone,
    splitSlotForTimezone
};
