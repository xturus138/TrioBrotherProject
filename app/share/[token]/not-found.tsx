import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <CardTitle className="text-xl text-gray-900">Share Link Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">This share link doesn't exist, has expired, or has been removed by the owner.</p>
          <Link href="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Go to BestTrio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
