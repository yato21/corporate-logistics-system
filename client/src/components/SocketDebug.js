import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

const SocketDebug = () => {
  const orders = useSelector(state => state.orders.items);

  useEffect(() => {
    console.log('Текущие заказы:', orders);
  }, [orders]);

  return null;
};

export default SocketDebug; 