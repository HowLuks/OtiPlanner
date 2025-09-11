import useLocalStorage from "@/lib/storage";
import { useEffect, useState } from "react";

export default function useSyncedStore<T>(key: string, initialValue: T): T | null {
    const [data] = useLocalStorage(key, initialValue);
    const [syncedData, setSyncedData] = useState<T | null>(null);

    useEffect(() => {
        setSyncedData(data);
    }, [data]);

    return syncedData;
}
