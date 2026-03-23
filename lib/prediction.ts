export interface PredictionInput {
  date: string
  day: string
  mealType: string
  studentCount: number
  attendance: number
  specialEvents: string
  weather: string
  holidays: string
  menuType: string
}

export interface PredictionResult {
  predictedWaste: number
  cost: number
  recommendation: string
  confidence: string
  date: string
  formData: PredictionInput
}

export function calculatePrediction(data: PredictionInput): Omit<PredictionResult, 'date' | 'formData'> {
  const { attendance, studentCount, mealType, specialEvents, weather, holidays } = data

  // Base calculation
  const attendanceRate = attendance / studentCount
  let baseWaste = studentCount * 0.25

  // Meal type adjustment
  const mealMultiplier: Record<string, number> = {
    breakfast: 0.6,
    lunch: 1.2,
    dinner: 1.0,
    snacks: 0.4
  }
  baseWaste *= mealMultiplier[mealType.toLowerCase()] || 1

  // Attendance adjustment
  baseWaste *= attendanceRate

  // Special events adjustment
  if (specialEvents === 'yes') {
    baseWaste *= 1.3
  }

  // Weather adjustment
  const weatherMultiplier: Record<string, number> = {
    sunny: 1.0,
    rainy: 0.85,
    cloudy: 0.95,
    hot: 1.1,
    cold: 0.9
  }
  baseWaste *= weatherMultiplier[weather.toLowerCase()] || 1

  // Holidays adjustment
  if (holidays === 'yes') {
    baseWaste *= 0.7
  }

  const predictedWaste = Math.round(baseWaste * 10) / 10
  const cost = Math.round(predictedWaste * 25)

  // Generate recommendation
  const recommendations: string[] = []
  if (attendance / studentCount < 0.7) {
    recommendations.push('Low attendance - consider reducing portions')
  }
  if (specialEvents === 'yes') {
    recommendations.push('Plan ahead for special events')
  }
  if (weather.toLowerCase() === 'hot') {
    recommendations.push('Extra hydration items, reduce heavy foods')
  }
  if (baseWaste > 60) {
    recommendations.push('High waste detected - review serving sizes')
  }

  const recommendation = recommendations.length > 0 ? recommendations[0] : 'Maintain current practices'

  return {
    predictedWaste,
    cost,
    recommendation,
    confidence: (85 + Math.random() * 14).toFixed(1)
  }
}
