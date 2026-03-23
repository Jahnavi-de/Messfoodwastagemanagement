'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Minus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const API_URL =
  process.env.NEXT_PUBLIC_WASTE_API_URL ?? 'http://127.0.0.1/nextjsbackend/predict.php'
const SAVE_API_URL =
  process.env.NEXT_PUBLIC_PREDICTION_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_prediction.php'

type RecommendationDetails = {
  quantities: {
    rice_kg: number
    dal_kg: number
    roti_count: number
    veg_kg: number
    nonveg_kg: number
  }
  reduction_percent: number
  current_waste_kg: number
  optimized_waste_kg: number
  waste_reduction_kg: number
}

type PredictionState = {
  predictedWaste: number
  cost: number
  recommendation: string
  confidence: number
  recommendations: RecommendationDetails | null
}

function getDayFromDate(dateString: string) {
  if (!dateString) return 'Monday'

  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Monday'

  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
}

function formatKg(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0 kg'
  return `${value} kg`
}

export default function PredictPage() {
  const { addPrediction } = useAuth()
  const [formData, setFormData] = useState({
    date: '',
    dayOfWeek: 'Monday',
    mealType: 'lunch',
    studentsEnrolled: '',
    averageAttendance: '',
    specialEvent: 'no',
    menusServed: '',
    leftoverFromPreviousDay: '',
    menuItems: [] as string[],
  })

  const [prediction, setPrediction] = useState<PredictionState | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'date') {
      setFormData((prev) => ({
        ...prev,
        date: value,
        dayOfWeek: getDayFromDate(value),
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMenusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setFormData((prev) => ({
      ...prev,
      menusServed: String(value),
      menuItems: Array(value).fill(''),
    }))
  }

  const handleMenuItemChange = (index: number, value: string) => {
    const updatedMenus = [...formData.menuItems]
    updatedMenus[index] = value
    setFormData((prev) => ({ ...prev, menuItems: updatedMenus }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPrediction(null)
    setSaveMessage(null)

    try {
      const payload = {
        studentsEnrolled: formData.studentsEnrolled,
        averageAttendance: formData.averageAttendance,
        menusServed: formData.menusServed,
        leftoverFromPreviousDay: formData.leftoverFromPreviousDay || '0',
        specialEvent: formData.specialEvent,
        mealType: formData.mealType,
        dayOfWeek: formData.dayOfWeek,
        menuItems: formData.menuItems,
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || data?.errors?.join(', ') || `API error ${response.status}`)
      }

      setPrediction({
        predictedWaste: data.predicted_waste_kg,
        cost: data.cost,
        recommendation: data.recommendation,
        confidence: data.confidence,
        recommendations: data.recommendations ?? null,
      })

      addPrediction(data.predicted_waste_kg, data.cost)

      try {
        const saveResponse = await fetch(SAVE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            predictedWasteKg: data.predicted_waste_kg,
            cost: data.cost,
            recommendation: data.recommendation,
            confidence: data.confidence,
            recommendations: data.recommendations,
          }),
        })

        const saveData = await saveResponse.json()

        if (!saveResponse.ok || !saveData?.success) {
          throw new Error(saveData?.message || 'Prediction save failed')
        }

        setSaveMessage('Prediction inputs saved to database.')
      } catch (saveErr: any) {
        setSaveMessage(saveErr.message ?? 'Prediction shown, but saving failed.')
      }
    } catch (err: any) {
      setError(err.message ?? 'Could not reach the prediction API. Is the backend and Flask server running?')
    } finally {
      setLoading(false)
    }
  }

  const recommendationDetails = prediction?.recommendations
  const rotiSelected = formData.menuItems.includes('roti')

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-white rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Wastage Predictor</h1>
            <p className="text-gray-600">Enter hostel details for accurate waste predictions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Type</label>
                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Students Enrolled</label>
                <input
                  type="number"
                  name="studentsEnrolled"
                  value={formData.studentsEnrolled}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 200"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Average Attendance (%)</label>
                <input
                  type="number"
                  name="averageAttendance"
                  value={formData.averageAttendance}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  placeholder="e.g., 85"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Event</label>
                <select
                  name="specialEvent"
                  value={formData.specialEvent}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Menus Served</label>
                <input
                  type="number"
                  value={formData.menusServed}
                  onChange={handleMenusChange}
                  min="1"
                  required
                  placeholder="e.g., 4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Leftover from Previous Day (kg)</label>
                <input
                  type="number"
                  name="leftoverFromPreviousDay"
                  value={formData.leftoverFromPreviousDay}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {formData.menuItems.length > 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Menu Items</label>
                {formData.menuItems.map((item, index) => (
                  <select
                    key={index}
                    value={item}
                    onChange={(e) => handleMenuItemChange(index, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Menu Item</option>
                    <option value="rice">Rice</option>
                    <option value="dal">Dal</option>
                    <option value="veg">Main Veg</option>
                    <option value="roti">Roti</option>
                    <option value="nonveg">Main Non-Veg</option>
                  </select>
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {saveMessage && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                {saveMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 text-lg transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">
                    <Minus className="w-5 h-5" />
                  </span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Get Prediction
                </>
              )}
            </button>
          </form>
        </div>

        {prediction && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-emerald-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Prediction Results</h2>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-transparent p-6 rounded-xl border border-emerald-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Predicted Waste</p>
                  <p className="text-3xl font-bold text-emerald-600">{prediction.predictedWaste} kg</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-transparent p-6 rounded-xl border border-blue-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Cost Impact</p>
                  <p className="text-3xl font-bold text-blue-600">Rs. {prediction.cost}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-transparent p-6 rounded-xl border border-amber-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Risk Level</p>
                  <p
                    className={`text-3xl font-bold ${
                      prediction.recommendation === 'High'
                        ? 'text-red-600'
                        : prediction.recommendation === 'Medium'
                          ? 'text-amber-600'
                          : 'text-green-600'
                    }`}
                  >
                    {prediction.recommendation}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-transparent p-6 rounded-xl border border-purple-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Model Confidence</p>
                  <p className="text-3xl font-bold text-purple-600">{prediction.confidence}%</p>
                </div>
              </div>

              {recommendationDetails && (
                <div className="mt-8 grid lg:grid-cols-2 gap-8">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Waste Comparison</h3>
                    <div className="space-y-4 text-lg">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-700">Original Predicted Waste</span>
                        <span className="font-bold text-red-500">{formatKg(recommendationDetails.current_waste_kg)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-700">Optimized Predicted Waste</span>
                        <span className="font-bold text-emerald-600">{formatKg(recommendationDetails.optimized_waste_kg)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-emerald-100 pt-4">
                        <span className="text-gray-900 font-semibold">Waste Reduction</span>
                        <span className="font-bold text-emerald-700">
                          {formatKg(recommendationDetails.waste_reduction_kg)} saved
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Recommended Cooking Quantities</h3>
                    <p className="text-gray-600 mb-6">
                      Reduced by {recommendationDetails.reduction_percent}% based on predicted waste level
                    </p>

                    <div className={`grid gap-4 ${rotiSelected ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-gray-600 mb-2">Rice</p>
                        <p className="text-3xl font-bold text-emerald-700">{recommendationDetails.quantities.rice_kg}</p>
                        <p className="text-xl font-semibold text-gray-700">kg</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-gray-600 mb-2">Dal</p>
                        <p className="text-3xl font-bold text-emerald-700">{recommendationDetails.quantities.dal_kg}</p>
                        <p className="text-xl font-semibold text-gray-700">kg</p>
                      </div>
                      {rotiSelected && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                          <p className="text-gray-600 mb-2">Roti</p>
                          <p className="text-3xl font-bold text-emerald-700">{recommendationDetails.quantities.roti_count}</p>
                          <p className="text-xl font-semibold text-gray-700">count</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-gray-600 mb-2">Veg</p>
                        <p className="text-3xl font-bold text-emerald-700">{recommendationDetails.quantities.veg_kg}</p>
                        <p className="text-xl font-semibold text-gray-700">kg</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                        <p className="text-gray-600 mb-2">Non-Veg</p>
                        <p className="text-3xl font-bold text-emerald-700">{recommendationDetails.quantities.nonveg_kg}</p>
                        <p className="text-xl font-semibold text-gray-700">kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  View Dashboard Graphs
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
