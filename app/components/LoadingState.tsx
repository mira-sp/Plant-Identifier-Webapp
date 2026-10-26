export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-lg text-gray-600">Identifying your plant...</p>
      <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
    </div>
  )
}