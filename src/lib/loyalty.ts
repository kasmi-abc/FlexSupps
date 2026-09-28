// 10pts/1000DA, 200pts=5%
export const PTS_PER_1000 = 10
export const REDEEM_COST = 200
export const REDEEM_DISCOUNT = 5

export function earnForTotal(total: number): number {
  return Math.floor(total / 1000) * PTS_PER_1000
}
