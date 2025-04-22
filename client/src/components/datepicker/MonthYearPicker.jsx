import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { serviceRevenueApi } from "@/pages/service/ServiceRevenueApi";
import "react-datepicker/dist/react-datepicker.css";

const MonthYearPicker = ({ selected, onChange, className }) => {
    return (
        <DatePicker
            selected={selected}
            onChange={onChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className={className}
        />
    );
};

export default MonthYearPicker;