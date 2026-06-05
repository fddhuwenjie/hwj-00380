export const calculateMacronutrientRatio = (protein, fat, carbohydrate) => {
  const total = protein * 4 + fat * 9 + carbohydrate * 4
  if (total === 0) {
    return { protein: 0, fat: 0, carbohydrate: 0 }
  }
  return {
    protein: Math.round((protein * 4 / total) * 100),
    fat: Math.round((fat * 9 / total) * 100),
    carbohydrate: Math.round((carbohydrate * 4 / total) * 100)
  }
}

export const checkNutritionWarnings = (nutrition) => {
  const warnings = []
  if (nutrition.sodium && nutrition.sodium > 600) {
    warnings.push({
      type: 'sodium',
      level: 'warning',
      message: '高钠预警：每份钠含量超过600mg'
    })
  }
  if (nutrition.fat && nutrition.fat > 20) {
    warnings.push({
      type: 'fat',
      level: 'warning',
      message: '高脂预警：每份脂肪含量超过20g'
    })
  }
  if (nutrition.sugar && nutrition.sugar > 25) {
    warnings.push({
      type: 'sugar',
      level: 'warning',
      message: '高糖预警：每份糖含量超过25g'
    })
  }
  return warnings
}

export const calculateTotalNutrition = (items) => {
  return items.reduce(
    (total, item) => {
      const factor = (item.amount || 1) / 100
      return {
        calories: total.calories + (item.nutrition?.calories || 0) * factor,
        protein: total.protein + (item.nutrition?.protein || 0) * factor,
        fat: total.fat + (item.nutrition?.fat || 0) * factor,
        carbohydrate: total.carbohydrate + (item.nutrition?.carbohydrate || 0) * factor,
        sodium: total.sodium + (item.nutrition?.sodium || 0) * factor,
        sugar: total.sugar + (item.nutrition?.sugar || 0) * factor,
        fiber: total.fiber + (item.nutrition?.fiber || 0) * factor
      }
    },
    { calories: 0, protein: 0, fat: 0, carbohydrate: 0, sodium: 0, sugar: 0, fiber: 0 }
  )
}

export const roundNutrition = (nutrition, decimals = 1) => {
  const result = {}
  for (const key in nutrition) {
    if (typeof nutrition[key] === 'number') {
      result[key] = Math.round(nutrition[key] * Math.pow(10, decimals)) / Math.pow(10, decimals)
    } else {
      result[key] = nutrition[key]
    }
  }
  return result
}
