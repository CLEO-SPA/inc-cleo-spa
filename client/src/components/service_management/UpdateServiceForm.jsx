import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';
import DateTimePicker from '../DateTimePicker';

const UpdateServiceForm = () => {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [category_id, setCategory_id] = useState('');
  const [serviceData, setServiceData] = useState({
    service_id: '',
    service_name: '',
    service_description: '',
    remarks: '',
    service_duration: '',
    service_default_price: '',
    service_is_active: true,
    service_category_id: category_id,
    service_sequence_no: '',
    service_created_at: new Date(),
  });

  //Message
  const [open, setOpen] = useState(false);
  //error message
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();

  //get Service Data
  const fetchServiceData = async () => {
    try {
      const res = await api.get(`/service/getSer/${id}`);
      const data = res.data;
      setServiceData({
        ...data,
        remarks: data.service_remarks,
        service_duration: data.service_estimated_duration,
        service_created_at: new Date(data.service_created_at),
      });
    } catch (error) {
      console.error('Error fetching service:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/service/getSerCat');
      setCategories(res.data); // Set the resolved data to state
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchServiceData();
    fetchCategories(); // Call the function
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setServiceData((prevData) => ({ ...prevData, service_is_active: e }));
  };

  const handleSelectChange = (e) => {
    setCategory_id(e.target.value);
    setServiceData((prevData) => ({ ...prevData, service_category_id: e.target.value }));
  };

  const handleDateTimeChange = (date) => {
    setServiceData((prev) => ({
      ...prev,
      service_created_at: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...serviceData,
        service_created_at: serviceData.service_created_at.toISOString(),
      };

      const response = await api.put(`/service/updateSer/${id}`, submissionData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 200) {
        setErrorMsg('');
        setCategory_id('');
        setServiceData({
          service_name: '',
          service_description: '',
          remarks: '',
          service_duration: '',
          service_default_price: '',
          service_is_active: true,
          service_category_id: '',
          service_created_at: new Date(),
        });
        setOpen(true);
      }
    } catch (error) {
      if (error.response) {
        // The server responded with a status code outside the range of 2xx
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response);
        setErrorMsg(error.response.statusText);
        setOpen(true);
      } else if (error.request) {
        // Request was made, but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something else happened in setting up the request
        console.error('Error:', error.message);
      }
    }
  };

  return (
    <>
      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Update Service Page</h3>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/sm');
                }}
                className="text-xl"
              >
                X
              </button>
            </div>
            <div className="mt-4">
              {errorMsg ? (
                <p className="text-xl text-red-500">{errorMsg}</p>
              ) : (
                <p className="text-xl">Service was updated successfully!</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  if (!errorMsg) {
                    navigate('/sm');
                  }
                }}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}

      <div className="bg-white p-8 rounded-md shadow-md">
        <h2 className="text-4xl font-bold mb-6">Update Service</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Id */}
          <div>
            <label className="block text-lg font-medium mb-2">Service ID:</label>
            {serviceData.service_id}
          </div>

          {/* Date of Creation */}
          <div>
            <label className="block text-lg font-medium mb-2">Date of Creation:</label>
            <DateTimePicker
              selectedDateTime={serviceData.service_created_at}
              onDateTimeSelect={handleDateTimeChange}
              className="mt-1"
            />
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-lg font-medium mb-2">Service Name</label>
            <input
              type="text"
              name="service_name"
              value={serviceData.service_name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Service Description */}
          <div>
            <label className="block text-lg font-medium mb-2">Service Description</label>
            <textarea
              name="service_description"
              value={serviceData.service_description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter service description"
              required
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-lg font-medium mb-2">Remarks</label>
            <textarea
              name="remarks"
              value={serviceData.remarks}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter remarks"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-lg font-medium mb-2">Duration</label>
            <input
              type="number"
              name="service_duration"
              value={serviceData.service_duration}
              onChange={handleChange}
              className="w-40 mr-2 p-2 border rounded-md"
              placeholder="60"
              required
            />{' '}
            Mins
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-lg font-medium mb-2">Unit Price</label>
            <input
              type="number"
              name="service_default_price"
              value={serviceData.service_default_price}
              onChange={handleChange}
              className="w-40 mr-2 p-2 border rounded-md"
              placeholder="100"
              required
            />{' '}
            SGD
          </div>

          {/* Is Visible Checkbox */}
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={serviceData.service_is_active}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="mr-2"
              />
              Is Visible
            </label>
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-lg font-medium mb-2">Service Category</label>
            {categories.length > 0 ? (
              <select
                name="service_category_id"
                value={serviceData.service_category_id}
                onChange={handleSelectChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.service_category_id} value={category.service_category_id}>
                    {category.service_category_name}
                  </option>
                ))}
              </select>
            ) : (
              <div>Loading...</div> // Display a fallback message or loader
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
              Update Service
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UpdateServiceForm;
