export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          JS
        </div>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">John Smith</p>
          <p className="text-sm text-muted-foreground">
            john.smith@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$49.00</div>
      </div>
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          OL
        </div>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Olivia Lee</p>
          <p className="text-sm text-muted-foreground">
            olivia.lee@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$99.00</div>
      </div>
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          WB
        </div>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">William Brown</p>
          <p className="text-sm text-muted-foreground">william.b@example.com</p>
        </div>
        <div className="ml-auto font-medium">+$39.00</div>
      </div>
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          SD
        </div>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Sofia Davis</p>
          <p className="text-sm text-muted-foreground">
            sofia.davis@example.com
          </p>
        </div>
        <div className="ml-auto font-medium">+$149.00</div>
      </div>
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          AW
        </div>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Alex Wilson</p>
          <p className="text-sm text-muted-foreground">alex.w@example.com</p>
        </div>
        <div className="ml-auto font-medium">+$29.00</div>
      </div>
    </div>
  );
}
