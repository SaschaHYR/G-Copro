import { MadeWithDyad } from "@/components/made-with-dyad";
import Sidebar from "@/components/Sidebar";
import TicketDataTable from "@/components/TicketDataTable";
import NewTicketModal from "@/components/NewTicketModal";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-extrabold text-foreground">Vos Tickets</h2>
            <NewTicketModal />
          </div>
          <TicketDataTable />
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;