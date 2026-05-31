const formatDateInTimezone = (value, timezone = 'UTC') => {
    if (!value) return '-';
    try {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: String(timezone || 'UTC'),
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(value));
    } catch {
        return new Date(value).toISOString();
    }
};

const hasDeliveryWindow = (startAt, endAt) => Boolean(startAt && endAt);

const formatDeliveryWindow = (startAt, endAt, timezone) => {
    if (!hasDeliveryWindow(startAt, endAt)) return '';
    return `${formatDateInTimezone(startAt, timezone)} - ${formatDateInTimezone(endAt, timezone)}`;
};

const buildDeliveryWindowFields = (order = {}) => {
    const fields = [];

    // Show customer's selected time
    const customerWindow = formatDeliveryWindow(
        order.deliveryCustomerStartAt,
        order.deliveryCustomerEndAt,
        order.deliveryCustomerTimezone
    );

    // Show converted time (Asia/Ho_Chi_Minh) without mentioning "Vietnam"
    const convertedWindow = formatDeliveryWindow(
        order.deliveryCustomerStartAt,
        order.deliveryCustomerEndAt,
        'Asia/Ho_Chi_Minh'
    );

    if (customerWindow) {
        fields.push({
            name: 'Customer Selected Time',
            value: customerWindow,
            inline: false
        });
    }

    // Only show converted time if it's different from customer time
    if (convertedWindow && convertedWindow !== customerWindow) {
        fields.push({
            name: 'Converted Time',
            value: convertedWindow,
            inline: false
        });
    }

    return fields;
};

module.exports = {
    buildDeliveryWindowFields,
    formatDateInTimezone,
    formatDeliveryWindow
};
