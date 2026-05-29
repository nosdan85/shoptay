const fs = require('fs');
const path = 'web/app/shop/page.tsx';
let code = fs.readFileSync(path, 'utf8');
const startMarker = '            {cart.length > 0 && (';
const endMarker = '      {(modalOpen || modalClosing) && selectedProduct && (';
const start = code.indexOf(startMarker);
const end = code.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error('Could not locate cart footer block');
const replacement = `            {cart.length > 0 && (
              <div className="border-t border-[#1E1E1E] px-4 py-4 space-y-3 sticky bottom-0 bg-[#111111]">
                <div className="space-y-3 rounded-[16px] border border-[#1E1E1E] bg-[#050505] p-3">
                  <div className="rounded-[12px] border border-[#2F9BE6]/40 bg-[#0A0E1A] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#49B6FF]">Referral</span>
                    </div>
                    <input
                      id="cart-referral"
                      value={referralCode}
                      onChange={(event) => setReferralCode(event.target.value)}
                      onBlur={() => { try { window.localStorage.setItem('pendingReferralCode', referralCode.trim()); } catch {} }}
                      placeholder="Enter referral code (e.g. REF-123456)"
                      className="w-full rounded-[10px] border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#49B6FF]"
                    />
                    {token && myReferralCode && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-[#B5B5B5]">Your code</div>
                          <div className="font-mono text-sm font-semibold text-[#49B6FF]">{myReferralCode}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(myReferralCode)}
                          className="rounded-[8px] bg-[#1E1E1E] p-2 text-white"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {token && myCoupons.length > 0 && (
                    <div className="rounded-[12px] border border-[#3DDC84]/40 bg-[#0A1A0E] p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#3DDC84]">Your coupons</span>
                      </div>
                      {myCoupons.slice(0, 3).map((c) => (
                        <div key={c.couponCode} className="mb-2 flex items-center justify-between last:mb-0">
                          <div className="min-w-0">
                            <div className="truncate font-mono text-sm font-semibold text-white">{c.couponCode}</div>
                            <div className="text-xs font-bold text-[#3DDC84]">{Number(c.discountPercent || 0)}% off</div>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setCouponCode(c.couponCode)} className="rounded-[8px] bg-[#1E1E1E] px-2 py-1 text-xs font-bold text-[#3DDC84]">USE</button>
                            <button type="button" onClick={() => void navigator.clipboard.writeText(c.couponCode)} className="rounded-[8px] bg-[#1E1E1E] p-1.5 text-white" title="Copy">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-[12px] border border-[#9A9A9A]/30 bg-[#0A0A0A] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Discount code</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="cart-coupon"
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value);
                          setCouponPreview(null);
                          setCouponPreviewKey('');
                          setCouponMessage('');
                        }}
                        placeholder="Enter code"
                        className="min-w-0 flex-1 rounded-[12px] border border-[#1E1E1E] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#2F9BE6]"
                      />
                      <button
                        type="button"
                        onClick={() => void previewCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="rounded-[10px] bg-[#1E1E1E] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={'text-xs ' + (activeCouponPreview ? 'text-[#3DDC84]' : 'text-[#FFB3B3]')}>{couponMessage}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-[#B5B5B5]">Subtotal</span><span>{formatMoney(cartTotal)}</span></div>
                  {activeCartDiscountAmount > 0 && (
                    <div className="flex justify-between text-[#3DDC84]"><span>Discount ({activeCartDiscountPercent}%)</span><span>-{formatMoney(activeCartDiscountAmount)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-[#1E1E1E] pt-2 text-lg font-semibold"><span>Total</span><span className="text-[#3DDC84]">{formatMoney(activeCartPayableTotal)}</span></div>
                </div>
                <button onClick={() => { closeCart(); void doCheckout(); }} disabled={submitting} className="w-full rounded-[14px] bg-[#2F9BE6] py-3 font-medium transition-all hover:bg-[#49B6FF] primary-hover-glow disabled:opacity-50">{submitting ? 'Processing...' : 'Checkout'}</button>
              </div>
            )}`;
code = code.slice(0, start) + replacement + code.slice(end);
fs.writeFileSync(path, code);
console.log('Rebuilt cart footer block');
