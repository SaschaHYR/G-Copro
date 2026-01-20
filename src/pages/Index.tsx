import { MadeWithDyad } from "@/components/made-with-dyad";
import Sidebar from "@/components/Sidebar";
import TicketDataTable from "@/components/TicketDataTable";
import NewTicketModal from "@/components/NewTicketModal";
import Header from "@/components/Header";
import { TicketFilterProvider } from "@/contexts/TicketFilterContext";

const Index = () => {
  return (
    <TicketFilterProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="w-full md:w-64">
            <Sidebar />
          </div>
          <main className="flex-1 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">Vos Tickets</h2>
              <NewTicketModal />
            </div>
            <TicketDataTable />
          </main>
        </div>
        <MadeWithDyad />
      </div>
    </TicketFilterProvider>
  );
};

export default Index;