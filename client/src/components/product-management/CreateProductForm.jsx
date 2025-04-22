import { useEffect, useState } from "react";
import { api } from "@/interceptors/axios";

const CreateProductForm = () => {
  const [categories, setCategories] = useState([]);
  const [category_id, setCategory_id] = useState("");
  const [formData, setFormData] = useState({
    product_name: "",
    product_description: "",
    remarks: "",
    product_default_price: "",
    product_is_active: false,
    product_category_id: category_id,
    product_sequence_no: "",
  });

  //Message
  const [open, setOpen] = useState(false);
  //error message
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/p/getProCat");
      setCategories(res.data); // Set the resolved data to state
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories(); // Call the function
  }, []);

  const fetchSequenceNo = async () => {
    if (!category_id) return; // Skip fetching if category_id is null or undefined
    try {
      const { data } = await api.get(`/p/getProSeqNoByCat/${category_id}`);
      setFormData((prevData) => ({ ...prevData, product_sequence_no: data.toString() }));
    } catch (error) {
      console.error("Error fetching sequence number:", error);
    }
  };

  useEffect(() => {
    fetchSequenceNo();
  }, [category_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setFormData((prevData) => ({ ...prevData, product_is_active: e }));
  };

  const handleSelectChange = (e) => {
    setCategory_id(e.target.value);
    setFormData((prevData) => ({ ...prevData, product_category_id: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/p/createPro", formData, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 201) {
        setErrorMsg("");
        setCategory_id("");
        setFormData({
          product_name: "",
          product_description: "",
          remarks: "",
          product_default_price: "",
          product_is_active: true,
          product_category_id: "",
        });
        setOpen(true);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        setErrorMsg(error.response.data.message);
        setOpen(true);
      } else {
        console.error("Error:", error.message);
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
              <h3 className="text-xl font-semibold">Create Product Page</h3>
              <button onClick={() => setOpen(false)} className="text-xl">X</button>
            </div>
            <div className="mt-4">
              {errorMsg ? (
                <p className="text-xl text-red-500">{errorMsg}</p>
              ) : (
                <p className="text-xl">Product was created successfully!</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setOpen(false)} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}

          <div className="bg-white p-8 rounded-md shadow-md">
            <h2 className="text-4xl font-bold mb-6">Create a Product</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-lg font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-lg font-medium mb-2">Product Description</label>
                <textarea
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter product description"
                  required
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-lg font-medium mb-2">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter remarks"
                  required
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-lg font-medium mb-2">Unit Price</label>
                <input
                  type="number"
                  name="product_default_price"
                  value={formData.product_default_price}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="100"
                  required
                />
              </div>

              {/* Is Visible Checkbox */}
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.product_is_active}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="mr-2"
                  />
                  Is Visible
                </label>
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-lg font-medium mb-2">Product Category</label>
                {categories.length > 0 ? (
                <select
                  name="product_category_id"
                  value={formData.product_category_id}
                  onChange={handleSelectChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.product_category_id} value={category.product_category_id}>
                      {category.product_category_name}
                    </option>
                  ))}
                </select>
                ):(
                  <div>Loading...</div> // Display a fallback message or loader
                )
              }
              </div>

              {/* Product Sequence Number */}
              <div>
                <label className="block text-lg font-medium mb-2">Product Sequence Number</label>
                <input
                  type="text"
                  name="product_sequence_no"
                  value={formData.product_sequence_no}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter sequence number"
                  disabled
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
                  Create Product
                </button>
              </div>
            </form>
          </div>
    </>
  );
};

export default CreateProductForm;
