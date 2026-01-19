import { MadeWithDyad } from "@/components/made-with-dyad";
import Sidebar from "@/components/Sidebar";
import TicketDataTable from "@/components/TicketDataTable";
import NewTicketModal from "@/components/NewTicketModal";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Gestion des Tickets</h1>
            <NewTicketModal />
          </div>
          <TicketDataTable />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;