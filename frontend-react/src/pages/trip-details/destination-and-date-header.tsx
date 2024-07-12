import { MapPin, Calendar, Settings2 } from "lucide-react";
import { Button } from "../../components/button";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import { format } from "date-fns";

interface Trip {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean
}

export function DestinationAndDateHeader() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<Trip | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setError("ID da viagem não fornecido");
      setLoading(false);
      return;
    }

    api.get(`trips/${tripId}`)
      .then(response => {
        setTrip(response.data.trip);
        setLoading(false);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch(_error => {
        setError("Erro ao carregar dados da viagem. Tente novamente.");
        setLoading(false);
      });
  }, [tripId]);

  const displayedDate = trip 
    ? `${format(new Date(trip.starts_at), "d' de 'LLL")} até ${format(new Date(trip.ends_at), "d' de 'LLL")}`
    : null;

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="px-4 h-16 rounded-xl bg-zinc-900 shadow-shape flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MapPin className="size-5 text-zinc-400" />
        <span className="text-zinc-100">{trip?.destination}</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-zinc-400" />
          <span className="text-zinc-100">{displayedDate}</span>
        </div>

        <div className="w-px h-6 bg-zinc-800" />

        <Button variant="secondary">
          Alterar local/data
          <Settings2 className="size-5" />
        </Button>
      </div>
    </div>
  );
}
