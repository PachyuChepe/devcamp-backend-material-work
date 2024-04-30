export class CreateCouponDto {
  type: 'percent' | 'fixed';
  value: number; // 할인율 또는 고정 금액
}
