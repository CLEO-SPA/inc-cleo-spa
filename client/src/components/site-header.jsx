import { SidebarIcon, Calendar } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const [currentDate, setCurrentDate] = useState({
    month: "",
    day: "",
    year: "",
  })
  
  useEffect(() => {
    const now = new Date()
    setCurrentDate({
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
      year: String(now.getFullYear())
    })
  }, [])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle date change submission
    const formData = new FormData(e.target)
    const month = formData.get('month')
    const day = formData.get('day')
    const year = formData.get('year')
    
    console.log(`Date changed to: ${month}/${day}/${year}`)
    // Here you would handle the date change logic
  }
  
  return (
    (<header
      className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <form onSubmit={handleSubmit} className="flex items-center gap-3 ml-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="month" className="text-xs whitespace-nowrap">Month:</Label>
              <Input
                id="month"
                name="month"
                type="text"
                placeholder="MM"
                className="w-14 h-8"
                maxLength={2}
                defaultValue={currentDate.month}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="day" className="text-xs whitespace-nowrap">Day:</Label>
              <Input
                id="day"
                name="day"
                type="text"
                placeholder="DD"
                className="w-14 h-8"
                maxLength={2}
                defaultValue={currentDate.day}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="year" className="text-xs whitespace-nowrap">Year:</Label>
              <Input
                id="year"
                name="year"
                type="text"
                placeholder="YYYY"
                className="w-16 h-8"
                maxLength={4}
                defaultValue={currentDate.year}
              />
            </div>
          </div>
          
          <Button type="submit" size="sm" className="h-8 flex items-center gap-1">
            <span>Change Date</span>
          </Button>
        </form>
      </div>
    </header>)
  );
}