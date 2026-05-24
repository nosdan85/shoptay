const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildPublicDeliverySlotQuery,
    parseLocalDateTimeInZone,
    splitSlotForTimezone
} = require('../utils/deliverySlots');

test('parseLocalDateTimeInZone interprets Vietnam admin time independently of server timezone', () => {
    const parsed = parseLocalDateTimeInZone('2026-05-25', '08:00', 'Asia/Ho_Chi_Minh');

    assert.equal(parsed.toISOString(), '2026-05-25T01:00:00.000Z');
});

test('buildPublicDeliverySlotQuery returns all active future slots without owner filtering', () => {
    const now = new Date('2026-05-24T12:00:00.000Z');
    const query = buildPublicDeliverySlotQuery(now);

    assert.deepEqual(query, {
        active: true,
        endAt: { $gte: now }
    });
    assert.equal(Object.hasOwn(query, 'ownerDiscordId'), false);
});

test('splitSlotForTimezone splits customer display at local midnight', () => {
    const segments = splitSlotForTimezone({
        id: 'slot-1',
        startAt: new Date('2026-05-25T06:00:00.000Z'),
        endAt: new Date('2026-05-25T08:00:00.000Z'),
        timezone: 'Asia/Bangkok'
    });

    assert.deepEqual(segments, [
        {
            id: 'slot-1:2026-05-25:0',
            slotId: 'slot-1',
            customerDateKey: '2026-05-25',
            customerDateLabel: 'Mon, May 25',
            customerTimeLabel: '1:00 PM - 3:00 PM'
        }
    ]);
});

test('splitSlotForTimezone places post-midnight segment on the next customer date', () => {
    const segments = splitSlotForTimezone({
        id: 'slot-2',
        startAt: new Date('2026-05-25T06:00:00.000Z'),
        endAt: new Date('2026-05-25T08:00:00.000Z'),
        timezone: 'America/Los_Angeles'
    });

    assert.deepEqual(segments, [
        {
            id: 'slot-2:2026-05-24:0',
            slotId: 'slot-2',
            customerDateKey: '2026-05-24',
            customerDateLabel: 'Sun, May 24',
            customerTimeLabel: '11:00 PM - 12:00 AM'
        },
        {
            id: 'slot-2:2026-05-25:1',
            slotId: 'slot-2',
            customerDateKey: '2026-05-25',
            customerDateLabel: 'Mon, May 25',
            customerTimeLabel: '12:00 AM - 1:00 AM'
        }
    ]);
});
