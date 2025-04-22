import React, { useState, useEffect } from "react";
import { api } from "@/interceptors/axios";
import FilteredSelect from "@/components/FieldSelector";

const MembershipTypeSelect = ({ value, onChange, label = "MembershipType" }) => {
    const [membershipType, setMembershipType] = useState([]);

    useEffect(() => {
        const fetchMembershipType = async () => {
            try {
                const response = await api.get("/ms");
                setMembershipType(response.data.allMembershipType || []); // Ensure it's always an array
            } catch (error) {
                console.error("Error fetching membership type:", error);
                setMembershipType([]); // Fallback to an empty array to prevent errors
            }
        };

        fetchMembershipType();
    }, []);


    return (
        <div className="w-full">
            <label className="block text-black mb-1">{label}</label>
            <FilteredSelect
                options={membershipType.map(mst => ({
                    id: mst.membership_type_id,
                    name: mst.membership_type_name
                }))}
                value={value}
                onChange={onChange}
                getOptionLabel={(option) => option.name}
                placeholder="Select a Membership Type"
                searchPlaceholder="Search Membership Type..."
                className="w-3/4"
            />
        </div>
    );
};

export default MembershipTypeSelect;
