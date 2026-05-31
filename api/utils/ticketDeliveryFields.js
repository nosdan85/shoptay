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

    // Only show customer's selected time and its conversion to Vietnam timezone
    const customerWindow = formatDeliveryWindow(
        order.deliveryCustomerStartAt,
        order.deliveryCustomerEndAt,
        order.deliveryCustomerTimezone
    );

    const vnWindow = formatDeliveryWindow(
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

    // Only show VN time if it's different from customer time
    if (vnWindow && vnWindow !== customerWindow) {
        fields.push({
            name: 'Converted to Vietnam Time',
            value: vnWindow,
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
