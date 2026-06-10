/**
 * Receipt ticket builder.
 * Generates ESC/POS commands for thermal printers and HTML for browser print.
 */

type TicketData = {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  orderNo: string;
  tableLabel?: string;
  type: string;
  cashierName?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  createdAt: string;
  note?: string;
};

/** Build ESC/POS commands for thermal printer */
export function buildEscPos(data: TicketData): Buffer {
  const buf: number[] = [];

  // Init
  buf.push(0x1b, 0x40); // ESC @

  // Center align + bold
  buf.push(0x1b, 0x61, 0x01); // center
  buf.push(0x1b, 0x45, 0x01); // bold
  buf.push(...text(data.storeName));
  buf.push(0x1b, 0x45, 0x00); // bold off
  buf.push(0x0a);

  if (data.storeAddress) buf.push(...text(data.storeAddress), 0x0a);
  if (data.storePhone) buf.push(...text(data.storePhone), 0x0a);
  buf.push(...text("--------------------------------"), 0x0a);

  // Left align
  buf.push(0x1b, 0x61, 0x00);

  buf.push(...text("单号: " + data.orderNo), 0x0a);
  buf.push(...text("类型: " + data.type), 0x0a);
  if (data.tableLabel) buf.push(...text("桌号: " + data.tableLabel), 0x0a);
  buf.push(...text("时间: " + data.createdAt.slice(0, 19)), 0x0a);
  buf.push(...text("--------------------------------"), 0x0a);

  // Items
  buf.push(...text("品名         数量   单价   小计"), 0x0a);
  for (const item of data.items) {
    const line = padRight(item.name.slice(0, 10), 10) + " " +
      padLeft(String(item.qty), 4) + " " +
      padLeft(item.price.toFixed(0), 5) + " " +
      padLeft((item.qty * item.price).toFixed(0), 6);
    buf.push(...text(line), 0x0a);
  }
  buf.push(...text("--------------------------------"), 0x0a);

  buf.push(...text(padRight("小计", 18) + padLeft(data.subtotal.toFixed(2), 14)), 0x0a);
  if (data.discount > 0) {
    buf.push(...text(padRight("优惠", 18) + padLeft("-" + data.discount.toFixed(2), 14)), 0x0a);
  }
  buf.push(0x1b, 0x45, 0x01); // bold
  buf.push(...text(padRight("合计", 18) + padLeft(data.total.toFixed(2), 14)), 0x0a);
  buf.push(0x1b, 0x45, 0x00);
  buf.push(...text(padRight("已付", 18) + padLeft(data.paidAmount.toFixed(2), 14)), 0x0a);
  if (data.changeAmount > 0) {
    buf.push(...text(padRight("找零", 18) + padLeft(data.changeAmount.toFixed(2), 14)), 0x0a);
  }
  buf.push(...text("--------------------------------"), 0x0a);
  buf.push(...text("支付: " + data.paymentMethod), 0x0a);
  if (data.note) buf.push(...text("备注: " + data.note), 0x0a);

  // Footer
  buf.push(0x1b, 0x61, 0x01); // center
  buf.push(...text("谢谢惠顾！"), 0x0a);
  buf.push(...text("欢迎再次光临"), 0x0a);

  // Cut
  buf.push(0x0a, 0x0a, 0x0a);
  buf.push(0x1d, 0x56, 0x42, 0x00); // partial cut

  return Buffer.from(buf);
}

/** Build HTML ticket string for browser window.print() */
export function buildHtmlTicket(data: TicketData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 16px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #999; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; }
  .left { text-align: left; } .right { text-align: right; }
  @media print { body { width: 72mm; } }
</style></head><body>
  <div class="center bold">${esc(data.storeName)}</div>
  ${data.storeAddress ? `<div class="center">${esc(data.storeAddress)}</div>` : ""}
  ${data.storePhone ? `<div class="center">${esc(data.storePhone)}</div>` : ""}
  <div class="line"></div>
  <div>单号: ${esc(data.orderNo)}</div>
  <div>类型: ${esc(data.type)}${data.tableLabel ? " · 桌号: " + esc(data.tableLabel) : ""}</div>
  <div>时间: ${new Date(data.createdAt).toLocaleString("zh-CN")}</div>
  <div class="line"></div>
  <div class="row bold"><span>品名</span><span>数量 单价 小计</span></div>
  ${data.items.map((i) =>
    `<div class="row"><span>${esc(i.name)}</span><span>${i.qty} × ¥${i.price.toFixed(2)} = ¥${(i.qty * i.price).toFixed(2)}</span></div>`
  ).join("")}
  <div class="line"></div>
  <div class="row"><span>小计</span><span class="right">¥${data.subtotal.toFixed(2)}</span></div>
  ${data.discount > 0 ? `<div class="row"><span>优惠</span><span class="right">-¥${data.discount.toFixed(2)}</span></div>` : ""}
  <div class="row bold"><span>合计</span><span>¥${data.total.toFixed(2)}</span></div>
  <div class="row"><span>已付</span><span>¥${data.paidAmount.toFixed(2)}</span></div>
  ${data.changeAmount > 0 ? `<div class="row"><span>找零</span><span>¥${data.changeAmount.toFixed(2)}</span></div>` : ""}
  <div>支付: ${esc(data.paymentMethod)}</div>
  ${data.note ? `<div>备注: ${esc(data.note)}</div>` : ""}
  <div class="line"></div>
  <div class="center bold">谢谢惠顾！</div>
  <div class="center">欢迎再次光临</div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;
}

function text(s: string): number[] {
  const buf: number[] = [];
  for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i));
  return buf;
}

function padRight(s: string, len: number): string {
  let result = s;
  while (result.length < len) result += " ";
  return result;
}

function padLeft(s: string, len: number): string {
  let result = s;
  while (result.length < len) result = " " + result;
  return result;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
