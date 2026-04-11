'use client'

import { useState, useEffect } from 'react'
import { FileUpload, UploadResult } from '@/components/upload/FileUpload'
import { DynamicForm, TemplateField } from '@/components/form/DynamicForm'
import { FileText, ArrowRight, CheckCircle2, ChevronLeft, Bot, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function CreateDocumentPage() {
  const router = useRouter()
  
  // States
  const [step, setStep] = useState(1)
  const [ocrResult, setOcrResult] = useState<UploadResult | null>(null)
  
  const [templates, setTemplates] = useState<{id: string, name: string}[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  const [isParsingAI, setIsParsingAI] = useState(false)
  const [aiParsedData, setAiParsedData] = useState<Record<string, string> | null>(null)
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([])
  
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Fetch templates on mount
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setTemplates(data)
        }
      })
      .catch(err => console.error("Could not load templates:", err))
  }, [])

  const handleUploadComplete = (result: UploadResult) => {
    setOcrResult(result)
    setStep(2)
  }

  const handleAnalyzeWithTemplate = async () => {
    if (!selectedTemplateId || !ocrResult) return
    
    setIsParsingAI(true)
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ocrResult.text,
          templateId: selectedTemplateId
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Lỗi phân tích AI')
      
      setAiParsedData(data.fields)
      
      // We already have the template and its fields in the `templates` state!
      const selectedTpl = (templates as any[]).find(t => t.id === selectedTemplateId)
      if (selectedTpl && selectedTpl.fields) {
         setTemplateFields(selectedTpl.fields)
      }
      
      setStep(3)
    } catch (err) {
      console.error(err)
      alert("Lỗi: " + (err as Error).message)
    } finally {
      setIsParsingAI(false)
    }
  }

  const handleGenerateDocument = async (values: Record<string, string>) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          fields: values,
          originalText: ocrResult?.text
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khởi tạo tài liệu')
      
      // Success. Redirect to dashboard or documents
      router.push('/dashboard/documents')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Lỗi tạo tài liệu: " + (err as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-white pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Navigation & Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-2 transition-colors">
              <ChevronLeft size={16} className="mr-1" /> Trở về Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-500" />
              Tạo tài liệu mới
            </h1>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", step >= 1 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>
              <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs", step >= 1 ? "bg-blue-600 text-white" : "bg-slate-300 text-white")}>1</span>
              Upload
            </div>
            <div className="w-4 h-px bg-slate-300" />
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", step >= 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>
              <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs", step >= 2 ? "bg-blue-600 text-white" : "bg-slate-300 text-white")}>2</span>
              Mẫu & AI
            </div>
            <div className="w-4 h-px bg-slate-300" />
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", step >= 3 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>
              <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs", step >= 3 ? "bg-blue-600 text-white" : "bg-slate-300 text-white")}>3</span>
              Kiểm tra
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Tải biểu mẫu/Tài liệu tham chiếu lên</h2>
                <p className="text-slate-500">Hệ thống AI sẽ quét nội dung và tự động trích xuất các trường dữ liệu quan trọng.</p>
              </div>
              <FileUpload onUploadComplete={handleUploadComplete} ocrMode="gemini" />
            </div>
          )}

          {step === 2 && ocrResult && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                <CheckCircle2 size={24} className="text-green-500" />
                <div>
                  <p className="font-semibold text-sm">Đã đọc văn bản thành công!</p>
                  <p className="text-xs mt-0.5 opacity-80">Trích xuất được {ocrResult.text.length} ký tự bằng {ocrResult.ocrEngine?.toUpperCase() || 'AI'}.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Hãy chọn Form mẫu tương ứng để phân tích:</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 appearance-none shadow-sm"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    <option value="" disabled>--- Chọn Biểu Mẫu ---</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep(1)} 
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Tải file khác
                </button>
                <button
                  onClick={handleAnalyzeWithTemplate}
                  disabled={!selectedTemplateId || isParsingAI}
                  className={cn(
                    "flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all",
                    !selectedTemplateId || isParsingAI 
                      ? "bg-slate-300 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                  )}
                >
                  {isParsingAI ? (
                    <><Bot className="animate-pulse" /> Đang dùng AI bóc tách dữ liệu...</>
                  ) : (
                    <>Chạy phân tích AI <ArrowRight size={20} /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && templateFields.length > 0 && aiParsedData && (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100 mb-6">
                <Bot size={24} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">AI đã xử lý xong!</p>
                  <p className="text-sm mt-1 opacity-80 leading-relaxed">
                    AI đã đoán và điền trước một số thông tin từ file bạn upload. Hãy rà soát lại và bấm Xác Nhận để sinh tài liệu Word chính thức.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <DynamicForm 
                  fields={templateFields} 
                  initialValues={aiParsedData}
                  onSubmit={handleGenerateDocument}
                  onCancel={() => setStep(2)}
                  isSubmitting={isGenerating}
                  submitLabel="Khởi tạo Tài Liệu PDF / Word"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
